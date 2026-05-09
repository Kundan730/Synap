"use client";
import React from "react";
import { Sandpack } from "@codesandbox/sandpack-react";

export default function CodeSandbox({ files, language = "react" }: { files?: Record<string, string>, language?: string }) {
  const templateMap: Record<string, any> = {
    "react": "react",
    "javascript": "vanilla",
    "html": "vanilla",
    "typescript": "vanilla-ts",
    "vue": "vue",
  };

  const template = templateMap[language] || "react";
  const defaultFilename = template === "react" ? "/App.js" : "/index.js";

  const sandpackFiles = React.useMemo(() => {
    if (!files || Object.keys(files).length === 0) return undefined;
    return files;
  }, [files]);

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
        files={sandpackFiles}
      />
    </div>
  );
}
