import { NextRequest, NextResponse } from "next/server";
import { geminiGenerate, GEMINI_API_KEY } from "@/lib/gemini";

// Bumped from the default route timeout — Manim renders can take 30–90s.
export const maxDuration = 120;

const MANIM_SYSTEM_PROMPT = `You write short Manim (Python) scripts that render educational ANIMATIONS (mp4 videos).

CRITICAL — YOU MUST USE self.play() — NOT self.add():
- The script MUST contain at least 3 self.play(...) calls. self.play() is what creates animation frames; without it, Manim emits a static PNG and the render is rejected.
- Never use self.add() to put objects on screen — always introduce them with self.play(Create(obj)) or self.play(FadeIn(obj)) or self.play(Write(obj)).
- Every visible mobject must be introduced or transformed via self.play().

OUTPUT RULES:
- Output ONLY valid, COMPLETE Python code. No markdown fences, no commentary, no half-finished lines.
- Every line must be syntactically valid. Never leave a statement, expression, or function call incomplete.
- The script MUST end with a complete self.wait() call as the last statement of construct().
- Define exactly ONE Scene subclass and name it Scene (literally "class Scene(Scene):").
- Start with: from manim import *
- Keep the script between 20 and 60 lines. Algorithms and multi-step proofs may need the upper end of this range.
- Use only standard Manim API (Scene, Mobject, Text, MathTex, Axes, Create, FadeIn, Transform, Write, ReplacementTransform, etc.).
- The animation should run for 8–20 seconds total — use self.wait() between major steps so the viewer can read.
- For math, use MathTex with double-backslash escapes (e.g. MathTex(r"\\\\frac{a}{b}")).
- Don't import non-standard packages (no scipy, no numpy beyond np if you must).
- Don't write to disk, don't open windows, don't use input(). Just self.add / self.play / self.wait.

BEFORE YOU FINISH: re-read your code.
1. Count your self.play() calls — there must be at least 3.
2. Every variable you reference must be defined.
3. Every parenthesis and bracket must be closed.
4. The last line of construct() must be self.wait(<seconds>).`;

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const modalUrl = process.env.MODAL_MANIM_URL;
    const modalToken = process.env.MODAL_MANIM_TOKEN;
    if (!modalUrl || !modalToken) {
      return NextResponse.json(
        { error: "MODAL_MANIM_URL or MODAL_MANIM_TOKEN not set in .env.local" },
        { status: 500 }
      );
    }

    // Generate Manim code, send to Modal, return mp4. Retried once on failure
    // because Gemini occasionally emits truncated Python (mid-line cutoff or
    // forgotten import). A second sample usually fixes it.
    const generateAndRender = async (regenerationHint?: string): Promise<
      | { ok: true; result: { video_b64: string; size_bytes: number } }
      | { ok: false; status: number; details: string }
    > => {
      const userPrompt = regenerationHint
        ? `Your previous attempt failed: ${regenerationHint}\n\nWrite a NEW, COMPLETE Manim scene that visually explains: "${topic}". The whole script must end with self.wait(). Do not truncate.`
        : `Write a Manim scene that visually explains: "${topic}". Keep it tight and educational, ~10 seconds of animation.`;

      const data = await geminiGenerate({
        prompt: userPrompt,
        systemInstruction: MANIM_SYSTEM_PROMPT,
        temperature: 0.2,        // lower = stays on script, less likely to truncate
        maxTokens: 4096,         // bumped from 2048 to give algorithms room to breathe
      });

      let code = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const fence = code.match(/```(?:python)?\n([\s\S]*?)```/);
      if (fence) code = fence[1].trim();
      code = code.replace(/```python/gi, "").replace(/```/g, "").trim();

      if (!code) {
        return { ok: false, status: 500, details: "Gemini returned empty Manim code" };
      }

      const modalRes = await fetch(modalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, scene_name: "Scene", quality: "l", token: modalToken }),
      });

      if (!modalRes.ok) {
        const text = await modalRes.text();
        return { ok: false, status: modalRes.status, details: text };
      }

      const result = await modalRes.json();
      if (result.error) {
        return { ok: false, status: 500, details: JSON.stringify(result) };
      }
      return { ok: true, result };
    };

    let outcome = await generateAndRender();

    if (!outcome.ok) {
      // Pull the most useful one-line summary from the error and retry once.
      const stderr = (() => {
        try { return JSON.parse(outcome.details).stderr ?? outcome.details; }
        catch { return outcome.details; }
      })();
      const summary = stderr
        .split("\n")
        .reverse()
        .find((line: string) => /Error|Played 0 animations/.test(line)) ?? stderr.slice(0, 300);
      console.warn(`Manim attempt 1 failed (${outcome.status}): ${summary} — retrying once`);
      outcome = await generateAndRender(summary);
    }

    if (!outcome.ok) {
      console.error("Manim render failed after retry:", outcome.status, outcome.details);
      return NextResponse.json(
        { error: `Modal render failed (${outcome.status})`, details: outcome.details.slice(0, 1000) },
        { status: 502 }
      );
    }

    const videoDataUrl = `data:video/mp4;base64,${outcome.result.video_b64}`;
    console.log(`✅ Manim rendered: ${outcome.result.size_bytes} bytes for "${topic}"`);
    return NextResponse.json({ videoDataUrl, topic });
  } catch (error: unknown) {
    console.error("Manim API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
