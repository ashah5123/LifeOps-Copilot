"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface TextHoverEffectProps {
  text: string;
  className?: string;
}

/** Large display text with pointer-following highlight (Aceternity-style). */
export default function TextHoverEffect({ text, className = "" }: TextHoverEffectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`relative select-none overflow-hidden ${className}`}
    >
      <motion.h2
        className="relative z-10 text-4xl md:text-5xl font-bold tracking-tight text-text-primary/20 dark:text-white/15"
        style={{
          WebkitTextStroke: "1px rgba(94,106,210,0.25)",
        }}
      >
        {text}
      </motion.h2>
      <motion.h2
        className="pointer-events-none absolute inset-0 z-20 text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text"
        style={{
          backgroundImage: `radial-gradient(120px 120px at ${pos.x}px ${pos.y}px, rgba(94,106,210,0.95), rgba(245,165,36,0.5), transparent 70%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        {text}
      </motion.h2>
    </div>
  );
}
