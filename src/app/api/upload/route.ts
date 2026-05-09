import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { geminiGenerate, GEMINI_API_KEY } from "@/lib/gemini";

export const maxDuration = 60;

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB cap
const MAX_TEXT_FOR_LLM = 60_000;        // chars sent to Gemini
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

    // pdf-parse v2+ exports a named function. Dynamic import keeps it out of the
    // build-time module graph so Next/Turbopack doesn't try to bundle its
    // pdfjs-dist dependency unnecessarily.
    const buf = Buffer.from(await file.arrayBuffer());
    const pdfModule = await import("pdf-parse");
    const pdfParse = (pdfModule as unknown as { pdf: (b: Buffer) => Promise<{ text: string }> }).pdf
      ?? (pdfModule as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default;
    const parsed = await pdfParse(buf);
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
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsedJson: { title?: string; concepts?: unknown };
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      console.error("Gemini concept extraction returned non-JSON:", raw.slice(0, 500));
      return NextResponse.json({ error: "Concept extraction failed" }, { status: 502 });
    }

    const title = typeof parsedJson.title === "string" ? parsedJson.title.slice(0, 80) : file.name;
    const concepts = Array.isArray(parsedJson.concepts)
      ? parsedJson.concepts
          .filter((c): c is string => typeof c === "string")
          .slice(0, MAX_CONCEPTS)
      : [];

    // Persist a small record so the dashboard / future sessions can use it.
    try {
      const client = await clientPromise;
      const db = client.db("pratyax");
      await db.collection("uploads").insertOne({
        title,
        filename: file.name,
        sizeBytes: file.size,
        concepts,
        createdAt: new Date(),
      });
    } catch (e) {
      // Persistence failure shouldn't block the user from seeing their concepts.
      console.warn("Failed to persist upload record:", e);
    }

    return NextResponse.json({ title, concepts, filename: file.name, sizeBytes: file.size });
  } catch (error: unknown) {
    console.error("Upload API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("pratyax");
    const uploads = await db
      .collection("uploads")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json({
      uploads: uploads.map((u) => ({
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
