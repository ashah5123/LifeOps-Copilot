"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface NoiseBackgroundProps {
  children: React.ReactNode;
  containerClassName?: string;
  gradientColors?: string[];
}

/** Animated gradient + noise texture behind children (e.g. auth CTAs). */
export default function NoiseBackground({
  children,
  containerClassName = "",
  gradientColors = ["#5E6AD2", "#7C85E0", "#F5A524"],
}: NoiseBackgroundProps) {
  const gradient = useMemo(
    () => `linear-gradient(135deg, ${gradientColors.join(", ")})`,
    [gradientColors]
  );

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <motion.div
        className="absolute inset-0 opacity-90 bg-[length:200%_200%]"
        style={{ backgroundImage: gradient }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
