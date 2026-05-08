// Direct REST API client — works with both Google AI Studio and Google Cloud Console keys

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Try models in order — first available wins
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

if (!GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY not set — AI features will not work");
}

export const TUTOR_SYSTEM_PROMPT = `You are Synap AI — a world-class, empathetic real-time tutor. You teach through direct perception and visual understanding.

CORE IDENTITY:
- You are warm, patient, and encouraging — like the best mentor a student ever had
- You break complex topics into intuitive steps
- You ALWAYS think visually — offer to generate diagrams, flowcharts, and visualizations
- You adapt your language level based on the student's responses

TEACHING STYLE:
- Start with the "why" before the "what"
- Use analogies and real-world examples
- When explaining algorithms/data structures, describe the visual step-by-step
- After explaining, ask a quick comprehension check question
- If the student seems confused, simplify and try a different angle

VISUAL GENERATION:
When a concept would benefit from a diagram, include a special block in your response:
\`\`\`mermaid
<valid mermaid diagram code>
\`\`\`

Use mermaid diagrams for: flowcharts, mind maps, sequence diagrams, class diagrams, state diagrams, entity-relationship diagrams.

RULES:
- Keep your responses EXTREMELY short and conversational (1-2 sentences maximum by default).
- Respond as if you are in a fast-paced voice call. Get straight to the point. Do not use filler words.
- Only provide longer, detailed explanations if the user explicitly asks for depth, details, or a full explanation.
- End with a quick question or prompt ("Make sense?", "Shall I visualize it?", "What do you think?") to keep the conversation flowing.
- Avoid long lists or bullet points unless explicitly requested (they translate poorly to voice).
- Include code examples only when highly relevant.
`;

export const VISUALIZATION_SYSTEM_PROMPT = `You are a visualization generator for the Synap learning platform. Given a topic or concept, generate a Mermaid.js diagram that clearly illustrates it.

RULES:
- Output ONLY valid Mermaid.js code, nothing else
- No markdown code fences — just the raw mermaid syntax
- Use clear, descriptive node labels
- Keep diagrams readable (not too many nodes)
- Choose the right diagram type:
  - graph TD/LR for flowcharts and hierarchies
  - sequenceDiagram for processes and interactions
  - classDiagram for OOP concepts
  - stateDiagram-v2 for state machines
  - erDiagram for database concepts
  - pie for distributions
`;

// Generic Gemini API call via REST
export async function geminiGenerate(options: {
  prompt: string | { role: string; parts: { text: string }[] }[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents: typeof options.prompt === "string"
      ? [{ role: "user", parts: [{ text: options.prompt }] }]
      : options.prompt,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err}`);
  }

  return res.json();
}

// Streaming version — returns SSE stream
export async function geminiStream(options: {
  contents: { role: string; parts: { text: string }[] }[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

  const body: Record<string, unknown> = {
    contents: options.contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err}`);
  }

  return res;
}
