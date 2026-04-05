"use client";

import React, { useRef, useState, useEffect } from "react";

interface GlowingEffectProps {
  className?: string;
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
}

/** Proximity glow that follows pointer inside the parent card (parent must be `position: relative`). */
export default function GlowingEffect({
  className = "",
  spread = 40,
  glow = true,
  disabled = false,
}: GlowingEffectProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (disabled || !glow) return;
    const node = elRef.current?.parentElement;
    if (!node) return;

    function onMove(e: MouseEvent) {
      const el = elRef.current?.parentElement;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      });
    }

    function onLeave() {
      setPos({ x: 50, y: 50 });
    }

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node?.removeEventListener("mousemove", onMove);
      node?.removeEventListener("mouseleave", onLeave);
    };
  }, [disabled, glow]);

  if (disabled || !glow) return null;

  return (
    <div
      ref={elRef}
      className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(${spread * 8}px circle at ${pos.x}% ${pos.y}%, rgba(94,106,210,0.24), transparent 58%)`,
        }}
      />
    </div>
  );
}
