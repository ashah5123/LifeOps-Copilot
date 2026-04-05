"use client";

import React from "react";

interface GooeyInputProps {
  children: React.ReactNode;
  className?: string;
}

/** Soft gooey-style glow behind the search field (Linear-friendly, readable contrast). */
export default function GooeyInput({ children, className = "" }: GooeyInputProps) {
  const uid = React.useId().replace(/:/g, "");
  const filterId = `gooey-${uid}`;

  return (
    <div className={`relative w-full ${className}`}>
      <svg className="absolute w-0 h-0" aria-hidden>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div
        className="pointer-events-none absolute -inset-[2px] rounded-2xl opacity-80"
        style={{ filter: `url(#${filterId})` }}
      >
        <div className="h-full w-full rounded-2xl bg-gradient-to-r from-primary/35 via-violet-500/25 to-amber-500/25 blur-[2px]" />
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
