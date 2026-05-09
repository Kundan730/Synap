"use client";
import { useEffect, useRef, useState } from "react";

export default function HTMLAppletRenderer({ htmlCode }: { htmlCode: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!htmlCode) return;

    let cleanHtml = htmlCode;
    const htmlMatch = cleanHtml.match(/```html([\s\S]*?)```/);
    if (htmlMatch) {
      cleanHtml = htmlMatch[1].trim();
    }

    const blob = new Blob([cleanHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setIsLoading(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlCode]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "500px", position: "relative" }}
         className="rounded-[24px] overflow-hidden shadow-sm border border-slate-200 bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-white text-sm animate-pulse">Loading simulation...</div>
        </div>
      )}
      {blobUrl && (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          style={{ width: "100%", height: "100%", minHeight: "500px", border: "none", display: "block" }}
          allow="accelerometer; gyroscope"
          title="Interactive AI Applet"
        />
      )}
    </div>
  );
}
