import { NextRequest } from "next/server";
import { GEMINI_API_KEY, GEMINI_BASE_URL, GEMINI_MODEL } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Reject oversize payloads up front — we buffer the whole file in memory
    // for the base64 encode below, so without a cap a malicious upload could
    // OOM the worker.
    const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB
    if (audioFile.size > MAX_AUDIO_BYTES) {
      return Response.json(
        { error: `Audio too large (max ${MAX_AUDIO_BYTES} bytes)` },
        { status: 413 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    console.log(`🎙️ Transcribe API: Received ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB of ${mimeType}`);

    // Use Gemini to transcribe
    const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
            {
              text: "Transcribe this audio exactly as spoken. Output ONLY the transcribed text, nothing else. No quotes, no labels, no formatting. If you cannot hear anything or the audio is silent, respond with exactly: [SILENT]",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini transcribe error:", err);
      return Response.json({ error: `Gemini API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (transcript === "[SILENT]" || !transcript) {
      return Response.json({ transcript: "" });
    }

    console.log(`✅ Transcription: "${transcript}"`);
    return Response.json({ transcript });
  } catch (error: unknown) {
    console.error("Transcribe error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
