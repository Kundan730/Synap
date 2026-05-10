import { NextRequest, NextResponse } from "next/server";
import { geminiGenerate, GEMINI_API_KEY } from "@/lib/gemini";

export const maxDuration = 30;

// Two modes through one endpoint to keep things tight: notes (bulleted study
// notes) and summary (a paragraph-form recap). Both take the chat history +
// topic and ask Gemini to distill it.

const NOTES_PROMPT = `You generate concise study notes from a tutoring conversation.

Output strict Markdown. Structure:
- A short overall heading (## Topic)
- A bulleted list of the most important facts, definitions, and rules covered
- Each bullet 1-2 lines max
- 8-15 bullets total
- If the conversation is too short, just produce 3-5 bullets

Output ONLY the markdown. No preamble.`;

const SUMMARY_PROMPT = `You write short narrative recaps of a tutoring session.

Output strict Markdown. 2-3 short paragraphs:
1. What was the topic and what was covered
2. Key insights or 'aha' moments
3. (optional) What the learner should review next

Be specific to the conversation — don't write generic content. Output ONLY the markdown. No preamble.`;

interface IncomingMessage {
  role: "user" | "ai";
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }
    const body = await req.json();
    const mode: unknown = body?.mode;
    const messages: unknown = body?.messages;
    const topic: unknown = body?.topic;

    if (mode !== "notes" && mode !== "summary") {
      return NextResponse.json({ error: "mode must be 'notes' or 'summary'" }, { status: 400 });
    }
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
    }

    // Flatten the chat into a transcript. Cap length so we don't blow the prompt.
    const transcript = (messages as IncomingMessage[])
      .filter(m => m && typeof m.text === "string" && m.text.trim().length > 0)
      .map(m => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`)
      .join("\n")
      .slice(0, 30_000);

    if (!transcript.trim()) {
      return NextResponse.json({ markdown: "_No conversation yet — start chatting with the AI tutor first._" });
    }

    const userPrompt = `Topic: ${typeof topic === "string" ? topic : "General Learning"}\n\nConversation transcript:\n\n${transcript}`;

    const data = await geminiGenerate({
      prompt: userPrompt,
      systemInstruction: mode === "notes" ? NOTES_PROMPT : SUMMARY_PROMPT,
      temperature: 0.3,
      maxTokens: 1500,
    });

    let markdown = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    markdown = markdown.replace(/```markdown/gi, "").replace(/```/g, "").trim();

    return NextResponse.json({ markdown });
  } catch (e) {
    console.error("/api/notes error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
