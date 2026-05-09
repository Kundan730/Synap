"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    GGBApplet?: new (params: Record<string, unknown>, html5: boolean) => {
      inject: (id: string) => void;
    };
  }
}

const GGB_SCRIPT_SRC = "https://www.geogebra.org/apps/deployggb.js";

export default function GeoGebraRenderer({
  commands,
  appName = "geometry",
}: {
  commands: string[];
  appName?: "graphing" | "geometry" | "3d" | "classic" | "scientific";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = useRef<string>(`ggb-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.id = containerId.current;

    const init = () => {
      if (!window.GGBApplet || !containerRef.current) return;
      const params = {
        appName,
        width: 800,
        height: 500,
        showToolBar: true,
        showAlgebraInput: true,
        showMenuBar: false,
        // Run the agent-supplied GeoGebra commands once the applet is ready.
        appletOnLoad: (api: { evalCommand: (cmd: string) => boolean }) => {
          for (const cmd of commands) {
            try {
              api.evalCommand(cmd);
            } catch (e) {
              console.warn("GeoGebra command failed:", cmd, e);
            }
          }
        },
      };
      const applet = new window.GGBApplet(params, true);
      applet.inject(containerId.current);
    };

    if (window.GGBApplet) {
      init();
    } else {
      // Inject the deployggb script once and wait for it to load.
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${GGB_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", init, { once: true });
      } else {
        const s = document.createElement("script");
        s.src = GGB_SCRIPT_SRC;
        s.async = true;
        s.onload = init;
        document.body.appendChild(s);
      }
    }
  }, [commands, appName]);

  return (
    <div className="w-full h-full min-h-[500px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200 bg-white">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
