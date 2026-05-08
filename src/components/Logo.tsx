"use client";

import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

export default function Logo({ className = "", iconOnly = false, size = "md", inverted = false }: LogoProps) {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}
        style={{ 
          background: inverted ? "white" : "var(--gradient-primary)",
          color: inverted ? "var(--color-primary)" : "white" 
        }}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-7 h-7"}
        >
          {/* Abstract Synapse/S-shape Logo */}
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
        </svg>
      </div>
      {!iconOnly && (
        <span 
          className={`${textClasses[size]} font-bold tracking-tight`} 
          style={{ color: inverted ? "white" : "var(--color-text)" }}
        >
          Synap
        </span>
      )}
    </div>
  );
}
