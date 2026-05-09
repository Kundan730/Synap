"use client";
import { useEffect, useRef, useState } from "react";

export default function HTMLAppletRenderer({ htmlCode }: { htmlCode: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [renderedHtml, setRenderedHtml] = useState("");

  useEffect(() => {
    // Extract HTML block even if AI includes conversational filler
    let cleanHtml = htmlCode;
    const htmlMatch = htmlCode.match(/```html([\s\S]*?)```/);
    if (htmlMatch) {
      cleanHtml = htmlMatch[1].trim();
    } else {
      const anyMatch = htmlCode.match(/```([\s\S]*?)```/);
      if (anyMatch) cleanHtml = anyMatch[1].trim();
    }

    // We can use state to hold the clean HTML and pass it to srcDoc
    setRenderedHtml(cleanHtml);
  }, [htmlCode]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200 bg-white">
      <iframe
        srcDoc={renderedHtml}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        title="Interactive AI Applet"
      />
    </div>
  );
}
