import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { geminiGenerate, GEMINI_API_KEY } from "@/lib/gemini";

export const maxDuration = 60;

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB cap
const MAX_TEXT_FOR_LLM = 60_000;        // chars sent to Gemini for concept extraction
const MAX_TEXT_FOR_STORAGE = 80_000;    // cap on what we persist for later session context
const MAX_CONCEPTS = 12;

const CONCEPT_SYSTEM_PROMPT = `You extract a study syllabus from raw document text.

Given the text of a PDF (lecture notes, textbook chapter, slide deck, etc.), produce a JSON object:

{
  "title": "<short title for the document, <60 chars>",
  "concepts": [
    "<concept 1, suitable as a topic to study>",
    "<concept 2>",
    ...
  ]
}

RULES:
- Output ONLY valid JSON. No markdown fences, no commentary.
- 3 to 12 concepts. Each concept is 2-6 words, suitable to teach in a single tutoring session.
- Concepts should be specific enough to be teachable (good: "Backpropagation Algorithm". bad: "Chapter 3").
- If the text is gibberish or empty, return { "title": "Untitled", "concepts": [] }.`;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: `File too large (max ${MAX_PDF_BYTES} bytes)` }, { status: 413 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only .pdf files are accepted right now" }, { status: 400 });
    }

    // pdf-parse v1 — runs entirely on the Node main thread, no pdfjs worker.
    // We import the inner lib directly to dodge the package's index.js, which
    // has a stray debug block that tries to read a test fixture at runtime
    // (triggered under Turbopack's module wrapping). Long-standing issue:
    // https://gitlab.com/autokent/pdf-parse/-/issues/24
    const pdfBytes = Buffer.from(await file.arrayBuffer());
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = (pdfParseModule as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default;
    const parsed = await pdfParse(pdfBytes);
    const text = (parsed.text || "").slice(0, MAX_TEXT_FOR_LLM).trim();

    if (!text) {
      return NextResponse.json({ error: "Couldn't extract any text from this PDF" }, { status: 422 });
    }

    // Ask Gemini for the concept list.
    const data = await geminiGenerate({
      prompt: text,
      systemInstruction: CONCEPT_SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: 1024,
    });
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();

    // Robust JSON extraction. Gemini sometimes wraps in ```json ... ```,
    // sometimes adds a preamble like "Here is the JSON:", and very rarely
    // emits a refusal as plain prose. We strip fences first, then if that
    // still doesn't parse, fall back to the largest {...} blob in the text.
    const stripped = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsedJson: { title?: string; concepts?: unknown } | null = null;
    try {
      parsedJson = JSON.parse(stripped);
    } catch {
      const blob = stripped.match(/\{[\s\S]*\}/);
      if (blob) {
        try {
          parsedJson = JSON.parse(blob[0]);
        } catch {
          /* fall through */
        }
      }
    }

    if (!parsedJson) {
      console.error("Gemini concept extraction returned non-JSON. Raw output:", raw.slice(0, 800));
      return NextResponse.json(
        {
          error: "Concept extraction failed",
          // Preview helps debug from the browser without server access.
          preview: raw.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const title = typeof parsedJson.title === "string" ? parsedJson.title.slice(0, 80) : file.name;
    const concepts = Array.isArray(parsedJson.concepts)
      ? parsedJson.concepts
          .filter((c): c is string => typeof c === "string")
          .slice(0, MAX_CONCEPTS)
      : [];

    // Persist the upload — including the truncated text so a later session
    // can fetch this document as agent context (RAG-lite).
    let uploadId: string | undefined;
    try {
      const client = await clientPromise;
      const db = client.db("pratyax");
      const result = await db.collection("uploads").insertOne({
        title,
        filename: file.name,
        sizeBytes: file.size,
        concepts,
        text: text.slice(0, MAX_TEXT_FOR_STORAGE),
        createdAt: new Date(),
      });
      uploadId = result.insertedId.toString();
    } catch (e) {
      // Persistence failure shouldn't block the user from seeing their concepts.
      console.warn("Failed to persist upload record:", e);
    }

    return NextResponse.json({ uploadId, title, concepts, filename: file.name, sizeBytes: file.size });
  } catch (error: unknown) {
    console.error("Upload API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("pratyax");
    const id = req.nextUrl.searchParams.get("id");

    // GET /api/upload?id=<ObjectId> — single upload, includes the full text
    // so a session page can use it as agent context.
    if (id) {
      let oid: ObjectId;
      try {
        oid = new ObjectId(id);
      } catch {
        return NextResponse.json({ error: "Invalid upload id" }, { status: 400 });
      }
      const u = await db.collection("uploads").findOne({ _id: oid });
      if (!u) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
      return NextResponse.json({
        upload: {
          id: u._id.toString(),
          title: u.title,
          filename: u.filename,
          sizeBytes: u.sizeBytes,
          concepts: u.concepts ?? [],
          text: u.text ?? "",
          createdAt: u.createdAt,
        },
      });
    }

    // GET /api/upload — list of recent uploads, no text payload (would bloat
    // the response and isn't needed for the gallery view).
    const uploads = await db
      .collection("uploads")
      .find({}, { projection: { text: 0 } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json({
      uploads: uploads.map((u) => ({
        id: u._id.toString(),
        title: u.title,
        filename: u.filename,
        sizeBytes: u.sizeBytes,
        concepts: u.concepts ?? [],
        createdAt: u.createdAt,
      })),
    });
  } catch (e) {
    console.error("Uploads list error:", e);
    return NextResponse.json({ error: "Failed to list uploads" }, { status: 500 });
  }
}
