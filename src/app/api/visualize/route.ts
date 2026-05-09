import { NextRequest, NextResponse } from "next/server";
import { geminiGenerate, VISUALIZATION_SYSTEM_PROMPT, GEMINI_API_KEY } from "@/lib/gemini";

export const maxDuration = 60; // Allow up to 60 seconds for Gemini to generate complex 3D applets

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
      const prompt = `Write a complete, single-file HTML document for a visually stunning, highly interactive applet about: "${topic}". 
      MUST RULES:
      - Output ONLY valid HTML code. Start with <!DOCTYPE html>.
      - Choose the BEST library for the job via CDN: 
          - For Maps: Use Leaflet.js (include CSS/JS from unpkg or cdnjs).
          - For Graphs: Use Chart.js.
          - For Physics/2D simulations: Use p5.js.
          - For 3D: Use Three.js. CRITICAL: You MUST use r128 to ensure OrbitControls works without ES modules. 
            Include these exact library scripts in your <head>:
            <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
            Then, write your simulation logic in a standard <script> tag. DO NOT use <script type="module"> or import statements.
            CRITICAL FOR TEXTURES: You MUST call .setCrossOrigin('Anonymous') on your TextureLoader or the images will fail to load and the objects will be black! Example: new THREE.TextureLoader().setCrossOrigin('Anonymous').load(...)
            CRITICAL FOR TEXTURES 2: NEVER load textures from threejs.org or jsdelivr (they block CORS or have limits). Always use raw github urls for textures: e.g. https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/...
      - Make it highly interactive and visually premium (dark mode, vibrant colors, tooltips, hover effects).
      - Ensure the applet fills the full window: body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; }
      - Keep the HTML file UNDER 200 LINES. Use public APIs (e.g. fetch GeoJSON for maps) instead of hardcoding massive datasets.
      - Ensure the code is COMPLETE and not truncated.`;

      const data = await geminiGenerate({
        prompt,
        systemInstruction: "You are an expert creative developer. Write beautiful, bug-free, interactive HTML/JS applets. Output ONLY HTML code, no markdown.",
        temperature: 0.7,
        maxTokens: 8192,
      });

      let rawHtml = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Extract HTML from markdown code blocks if present
      const match = rawHtml.match(/```(?:html)?\n([\s\S]*?)\n```/i);
      if (match) {
        rawHtml = match[1].trim();
      } else {
        rawHtml = rawHtml.replace(/```html/gi, "").replace(/```/g, "").trim();
      }

      rawHtml = rawHtml.replace(/\s+integrity="[^"]*"/gi, "");
      rawHtml = rawHtml.replace(/\s+crossorigin="[^"]*"/gi, "");
      rawHtml = rawHtml.replace(/\s+crossorigin(?=[>\s])/gi, "");

      const externalUrls: string[] = [];
      const inlineScripts: string[] = [];

      rawHtml = rawHtml.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (_full: string, attrs: string, content: string) => {
        const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch) {
          externalUrls.push(srcMatch[1]);
          return "";
        } else if (content.trim()) {
          inlineScripts.push(content);
          return "";
        }
        return "";
      });

      const encodedScripts = inlineScripts.map(s => Buffer.from(s).toString("base64"));

      const bootScript = `
<script>
(function(){
  window.onerror = function(msg, url, line) {
    if (!document.getElementById('ai-error-log')) {
      var d = document.createElement('div');
      d.id = 'ai-error-log';
      d.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:rgba(255,0,0,0.9);color:#fff;padding:20px;font-family:monospace;z-index:99999;box-sizing:border-box;';
      document.body.appendChild(d);
    }
    document.getElementById('ai-error-log').innerHTML += '<p>Error: '+msg+' (Line: '+line+')</p>';
    return false;
  };

  var cdns = ${JSON.stringify(externalUrls)};
  var code = ${JSON.stringify(encodedScripts)};

  function loadCDN(url) {
    return new Promise(function(resolve) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = function(){ console.warn('CDN failed: '+url); resolve(); };
      document.head.appendChild(s);
    });
  }

  async function boot() {
    for (var i = 0; i < cdns.length; i++) await loadCDN(cdns[i]);
    for (var j = 0; j < code.length; j++) {
      var s = document.createElement('script');
      s.textContent = atob(code[j]);
      document.body.appendChild(s);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
` + "</s" + "cript>";


      // Inject boot loader before </body>
      if (rawHtml.includes("</body>")) {
        rawHtml = rawHtml.replace("</body>", bootScript + "\n</body>");
      } else {
        rawHtml += bootScript;
      }

      console.log(`✅ Applet generated: ${rawHtml.length} chars, ${externalUrls.length} CDN(s), ${inlineScripts.length} inline script(s)`);
      return NextResponse.json({ htmlCode: rawHtml, topic });
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
