"use client";

import React, { useState, useEffect, useRef } from "react";

interface TypewriterGreetingProps {
  text: string;
  className?: string;
}

/**
 * Repeating typewriter effect for the dashboard greeting line.
 */
export default function TypewriterGreeting({ text, className = "" }: TypewriterGreetingProps) {
  const [out, setOut] = useState("");
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    let alive = true;
    const t0 = setTimeout(() => setOut(""), 0);

    const run = async () => {
      while (alive) {
        const t = textRef.current;
        if (!t) break;
        for (let i = 0; i <= t.length && alive; i++) {
          if (textRef.current !== t) break;
          setOut(t.slice(0, i));
          await new Promise((r) => setTimeout(r, 42));
        }
        if (!alive) break;
        await new Promise((r) => setTimeout(r, 2600));
        if (!alive) break;
        for (let i = t.length; i >= 0 && alive; i--) {
          setOut(t.slice(0, i));
          await new Promise((r) => setTimeout(r, 18));
        }
        if (!alive) break;
        await new Promise((r) => setTimeout(r, 350));
      }
    };

    run();
    return () => {
      alive = false;
      clearTimeout(t0);
    };
  }, [text]);

  return (
    <span className="inline-flex max-w-full items-baseline gap-1">
      <span className={className}>{out}</span>
      <span
        className="inline-block h-[0.85em] w-[2px] shrink-0 animate-pulse rounded-sm bg-gradient-to-b from-amber-500 via-sky-400 to-violet-500"
        aria-hidden
      />
    </span>
  );
}
