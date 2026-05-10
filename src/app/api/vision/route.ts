import { NextRequest, NextResponse } from "next/server";
import { GEMINI_API_KEY, GEMINI_BASE_URL, GEMINI_MODEL } from "@/lib/gemini";

export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB cap

const VISION_SYSTEM_PROMPT = `You describe educational images in a way that a tutor can use as context.

Given an image (a diagram, screenshot, handwritten note, photo of a textbook page, equation, etc.), produce:

1. A 1-line caption of what the image shows.
2. A detailed description (3-6 bullet points) of the visible content — text, equations, key diagram elements, labels, anything notable.
3. If the image contains questions or problems, transcribe them precisely.

Output as plain markdown. No code fences, no preamble.`;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const form = await req.formData();
    const image = form.get("image") as File | null;
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: `Image too large (max ${MAX_IMAGE_BYTES} bytes)` }, { status: 413 });
    }
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "File is not an image" }, { status: 400 });
    }

    // Gemini's vision model takes base64-encoded inline data alongside the prompt.
    const buf = Buffer.from(await image.arrayBuffer());
    const base64 = buf.toString("base64");

    const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: image.type, data: base64 } },
            { text: "Describe this image as instructed." },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: VISION_SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini vision error:", res.status, errText);
      return NextResponse.json({ error: `Vision API error: ${res.status}`, details: errText.slice(0, 800) }, { status: 502 });
    }
    const data = await res.json();
    const description = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();

    if (!description) {
      return NextResponse.json({ error: "Empty response from vision model" }, { status: 502 });
    }

    return NextResponse.json({ description });
  } catch (e) {
    console.error("/api/vision error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
