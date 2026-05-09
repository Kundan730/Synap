import { NextRequest } from "next/server";
import { geminiStream, TUTOR_SYSTEM_PROMPT, GEMINI_API_KEY } from "@/lib/gemini";

export const maxDuration = 60; // Extend Vercel timeout for long streaming responses

export async function POST(req: NextRequest) {
  try {
    const { messages, topic } = await req.json();

    if (!GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Build conversation history
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // Stream from Gemini REST API
    const geminiRes = await geminiStream({
      contents,
      systemInstruction: TUTOR_SYSTEM_PROMPT + (topic ? `\n\nCurrent topic: ${topic}` : ""),
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Transform Gemini SSE stream → our own SSE stream
    const encoder = new TextEncoder();
    const reader = geminiRes.body!.getReader();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch {}
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
