"use client";

import { motion } from "framer-motion";

interface MovingBorderCardProps {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
  duration?: number;
}

export default function MovingBorderCard({
  children,
  className = "",
  borderRadius = "1rem",
  duration = 6,
}: MovingBorderCardProps) {
  return (
    <div className={`relative p-[1px] overflow-hidden ${className}`} style={{ borderRadius }}>
      {/* Animated border */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, #5E6AD2 10%, transparent 20%, transparent 50%, #F5A524 60%, transparent 70%)",
          borderRadius,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner content */}
      <div className="relative bg-surface rounded-[calc(1rem-1px)] h-full" style={{ borderRadius: `calc(${borderRadius} - 1px)` }}>
        {children}
      </div>
    </div>
  );
}
