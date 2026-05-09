"use client";
import React from "react";
import { Sandpack } from "@codesandbox/sandpack-react";

export default function CodeSandbox({ initialCode, language = "react" }: { initialCode?: string, language?: string }) {
  // Map our simplified languages to Sandpack templates
  const templateMap: Record<string, any> = {
    "react": "react",
    "javascript": "vanilla",
    "html": "vanilla",
    "typescript": "vanilla-ts",
    "vue": "vue",
  };

  const template = templateMap[language] || "react";
  const filename = template === "react" ? "/App.js" : "/index.js";

  // Memoize the initial files to prevent Sandpack from resetting the editor 
  // on every parent component re-render (e.g. from the session timer).
  const files = React.useMemo(() => {
    return initialCode ? { [filename]: initialCode } : undefined;
  }, [initialCode, filename]);

  return (
    <div className="w-full h-full min-h-[500px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200 bg-[#151515]">
      <Sandpack
        template={template}
        theme="dark"
        options={{
          showNavigator: false,
          editorHeight: 600,
          showTabs: true,
          showInlineErrors: true,
          wrapContent: true,
        }}
        files={files}
      />
    </div>
  );
}
