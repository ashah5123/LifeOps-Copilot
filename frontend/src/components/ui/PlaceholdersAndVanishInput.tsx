"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  value?: string;
  id?: string;
  onFocus?: () => void;
  className?: string;
}

export default function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  value: controlledValue,
  id,
  onFocus,
  className = "",
}: PlaceholdersAndVanishInputProps) {
  const [internal, setInternal] = useState("");
  const value = controlledValue !== undefined ? controlledValue : internal;
  const setValue = (v: string) => {
    if (controlledValue === undefined) setInternal(v);
  };
  const [phIndex, setPhIndex] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (value.length > 0) return;
    tickRef.current = setInterval(() => {
      setPhIndex((i) => (i + 1) % placeholders.length);
    }, 4000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [value.length, placeholders.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (controlledValue === undefined) setValue(e.target.value);
    onChange(e);
  };

  return (
    <form
      className={`relative w-full ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
    >
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 z-20 w-4 h-4 -translate-y-1/2 text-text-secondary" />
      <input
        id={id}
        type="text"
        value={controlledValue !== undefined ? controlledValue : internal}
        onChange={handleChange}
        onFocus={onFocus}
        className="relative z-10 w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-16 text-sm text-text-primary placeholder-transparent focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
      {value.length === 0 && (
        <div className="pointer-events-none absolute left-10 top-1/2 z-[5] flex h-5 -translate-y-1/2 items-center overflow-hidden text-sm text-text-secondary/70">
          <AnimatePresence mode="wait">
            <motion.span
              key={phIndex}
              initial={{ y: 12, opacity: 0, filter: "blur(6px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -12, opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="block truncate max-w-[min(100%,14rem)] sm:max-w-[18rem]"
            >
              {placeholders[phIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
      <kbd className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 sm:inline-flex items-center gap-0.5 rounded border border-border bg-surface-hover px-1.5 py-0.5 font-mono text-[10px] text-text-secondary/60">
        Ctrl K
      </kbd>
    </form>
  );
}
