"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidRendererProps {
  code: string;
  className?: string;
}

export default function MermaidRenderer({ code, className = "" }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          themeVariables: {
            primaryColor: "#ede9fe",
            primaryTextColor: "#4f46e5",
            primaryBorderColor: "#a78bfa",
            lineColor: "#8b5cf6",
            secondaryColor: "#f0fdf4",
            tertiaryColor: "#e0f2fe",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "14px",
          },
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
          securityLevel: "loose",
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setRendered(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Mermaid render error:", err);
          setError("Could not render diagram");
          setRendered(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div className={`flex items-center justify-center p-6 rounded-xl ${className}`}
        style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center transition-opacity duration-300 ${rendered ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ minHeight: 120 }}
    />
  );
}
