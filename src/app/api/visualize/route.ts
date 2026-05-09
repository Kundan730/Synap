import { NextRequest } from "next/server";
import { geminiGenerate, VISUALIZATION_SYSTEM_PROMPT, GEMINI_API_KEY } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { topic, context, type } = await req.json();

    if (!topic) {
      return Response.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    if (type === "applet") {
      const prompt = `Write a p5.js script for a visually stunning, highly interactive simulation about: "${topic}". 
      MUST RULES:
      - ONLY write the Javascript code. Do NOT write HTML or <script> tags.
      - ALWAYS define setup() and draw() functions. Assume canvas is resized to window automatically.
      - DO NOT use WEBGL mode. Use standard 2D canvas only, but use gradients, trails, and glow effects to make it look premium.
      - Use translate(width/2, height/2) in draw() so everything is centered.
      - Add INTERACTIVITY (e.g., mouse hovering, clicking, dragging, or mouse position affecting the simulation).
      - Do not load external images. Draw everything using math, primitives, and colors.
      - CRITICAL: Your API key has a strict token limit! KEEP CODE UNDER 100 LINES. Do NOT write massive data arrays for planets. Generate objects PROCEDURALLY in a simple for-loop using random() or noise(). Ensure code is complete and not truncated.`;

      const data = await geminiGenerate({
        prompt,
        systemInstruction: "You are an expert creative coder. Write beautiful, bug-free, CONCISE p5.js Javascript code. Output ONLY code, no markdown.",
        temperature: 0.7,
        maxTokens: 8192,
      });

      let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Strip markdown backticks
      rawText = rawText.replace(/```javascript/g, "").replace(/```js/g, "").replace(/```/g, "").trim();

      // Wrap in a bulletproof Sandbox template
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>

  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
    canvas { display: block; }
    #error-log { position: absolute; top: 0; left: 0; background: rgba(255,0,0,0.9); color: white; padding: 20px; font-family: monospace; display: none; width: 100%; box-sizing: border-box; z-index: 9999; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
</head>
<body>
  <div id="error-log"></div>
  <script>
    window.onerror = function(msg, url, line) {
      document.getElementById('error-log').style.display = 'block';
      document.getElementById('error-log').innerHTML += '<p>Error: ' + msg + ' (Line: ' + line + ')</p>';
      return false;
    };
    
    // Auto-resize logic
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  </script>
  <script>
    // --- AI GENERATED CODE START ---
    ${rawText}
    // --- AI GENERATED CODE END ---
    
    // Fallback if AI didn't define setup
    if (typeof setup === 'undefined') {
      window.setup = function() {
        createCanvas(windowWidth, windowHeight);
        background(0);
        fill(255);
        textAlign(CENTER, CENTER);
        text("Simulation failed to generate setup()", width/2, height/2);
      };
    } else {
      const originalSetup = setup;
      window.setup = function() {
        createCanvas(windowWidth, windowHeight);
        originalSetup();
      };
    }
  </script>
</body>
</html>`;

      return Response.json({ htmlCode: fullHtml, topic });
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
