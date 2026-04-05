"use client";

import React, { useState, useEffect, useRef } from "react";

interface TypingPlaceholderInputProps {
  id?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholders: string[];
  className?: string;
  required?: boolean;
  autoComplete?: string;
}

export default function TypingPlaceholderInput({
  id,
  type = "text",
  value,
  onChange,
  placeholders,
  className = "",
  required,
  autoComplete,
}: TypingPlaceholderInputProps) {
  const [displayPh, setDisplayPh] = useState("");
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let alive = true;

    const loop = async () => {
      let pi = 0;
      while (alive && valueRef.current.length === 0) {
        const phrase = placeholders[pi % placeholders.length] || "";
        for (let c = 0; c <= phrase.length && alive && valueRef.current.length === 0; c++) {
          setDisplayPh(phrase.slice(0, c));
          await new Promise((r) => setTimeout(r, 36 + Math.random() * 28));
        }
        if (!alive || valueRef.current.length > 0) break;
        await new Promise((r) => setTimeout(r, 2000));
        for (let c = phrase.length; c >= 0 && alive && valueRef.current.length === 0; c--) {
          setDisplayPh(phrase.slice(0, c));
          await new Promise((r) => setTimeout(r, 20));
        }
        pi++;
        await new Promise((r) => setTimeout(r, 400));
      }
    };

    if (value.length === 0) {
      loop();
    } else {
      const clear = setTimeout(() => setDisplayPh(""), 0);
      return () => {
        alive = false;
        clearTimeout(clear);
      };
    }

    return () => {
      alive = false;
    };
  }, [value, placeholders]);

  return (
    <input
      id={id}
      type={type}
      required={required}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      placeholder={value.length > 0 ? "" : displayPh}
      className={className}
    />
  );
}
