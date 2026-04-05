"use client";

import React from "react";

interface AuroraBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

/** Soft animated aurora wash for light mode page backgrounds. */
export default function AuroraBackground({ children, className = "" }: AuroraBackgroundProps) {
  return (
    <div className={`relative min-h-full overflow-hidden ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90 dark:opacity-0 dark:hidden"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[480px] w-[480px] rounded-full bg-primary/15 blur-[100px] animate-aurora-1" />
        <div className="absolute right-0 top-1/4 h-[420px] w-[420px] rounded-full bg-violet-400/20 blur-[100px] animate-aurora-2" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-amber-400/15 blur-[90px] animate-aurora-3" />
      </div>
      {children}
    </div>
  );
}
