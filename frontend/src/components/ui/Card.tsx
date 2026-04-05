"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export default function Card({
  children, className = "", padding = "md",
  hover = false, glow = false, onClick,
}: CardProps) {
  const base = `bg-surface border border-border rounded-2xl transition-all duration-300 ${paddings[padding]}`;
  const hoverStyles = hover ? "cursor-pointer" : "";
  const glowStyles = glow ? "card-glow gradient-border" : "";

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.025 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`${base} ${hoverStyles} ${glowStyles} hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 ${className}`}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${base} ${glowStyles} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
