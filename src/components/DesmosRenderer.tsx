"use client";
import { useEffect, useRef } from "react";

export default function DesmosRenderer({ equations }: { equations: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<any>(null);

  useEffect(() => {
    // Load Desmos script if not present
    if (!window.Desmos) {
      const script = document.createElement("script");
      script.src = "https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
      script.async = true;
      script.onload = initCalculator;
      document.body.appendChild(script);
    } else {
      initCalculator();
    }

    function initCalculator() {
      if (!containerRef.current || !window.Desmos) return;
      
      // Initialize calculator only once
      if (!calculatorRef.current) {
        calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
          expressions: true,
          settingsMenu: false,
          zoomButtons: true,
        });
      }

      const calc = calculatorRef.current;
      calc.setBlank(); // Clear previous graphs
      
      // Plot new equations
      equations.forEach((eq, index) => {
        calc.setExpression({ id: `graph-${index}`, latex: eq });
      });
    }

    // Don't destroy on unmount because we might just be changing equations.
    // React strict mode might unmount/remount quickly, so we handle it gracefully.
  }, [equations]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200" />;
}

declare global {
  interface Window {
    Desmos?: any;
  }
}
