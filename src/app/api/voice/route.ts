import { NextRequest } from "next/server";
import { textToSpeech } from "@/lib/elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json();

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("❌ ELEVENLABS_API_KEY is missing from .env.local");
      return Response.json(
        { error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log(`🎤 Voice API: Generating TTS for ${text.length} characters`);
    const audioBuffer = await textToSpeech(text, voiceId);
    console.log(`✅ Voice API: Audio buffer size = ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("❌ Voice API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
