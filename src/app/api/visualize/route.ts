import { NextRequest } from "next/server";
import { geminiGenerate, VISUALIZATION_SYSTEM_PROMPT, GEMINI_API_KEY } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { topic, context } = await req.json();

    if (!topic) {
      return Response.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const prompt = context
      ? `Generate a Mermaid.js diagram for: "${topic}"\n\nAdditional context: ${context}`
      : `Generate a Mermaid.js diagram for: "${topic}"`;

    const data = await geminiGenerate({
      prompt,
      systemInstruction: VISUALIZATION_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 1024,
    });

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const mermaidCode = rawText
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return Response.json({ mermaid: mermaidCode, topic });
  } catch (error: unknown) {
    console.error("Visualize API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
