if (!process.env.ELEVENLABS_API_KEY) {
  console.warn("⚠️  ELEVENLABS_API_KEY not set — voice features will not work");
}

export const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
export const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

// Curated ElevenLabs voices (all available on free tier)
export const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "Female", style: "Calm & Warm" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "Female", style: "Soft & Clear" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "Female", style: "Professional" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "Male", style: "Warm & Deep" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "Male", style: "Clear & Narrating" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "Male", style: "British & Authoritative" },
] as const;

export type VoiceOption = (typeof VOICES)[number];

// Default voice — "Sarah" — soft, clear female
export const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah

export async function textToSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<ArrayBuffer> {
  console.log(`🎙️ ElevenLabs TTS: "${text.slice(0, 50)}..." | voice: ${voiceId}`);

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`❌ ElevenLabs API error [${response.status}]:`, errorBody);
    throw new Error(`ElevenLabs API error: ${response.status} — ${errorBody}`);
  }

  console.log("✅ ElevenLabs TTS: Audio generated successfully");
  return response.arrayBuffer();
}
