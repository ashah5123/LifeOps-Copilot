"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const paddingStyles = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
  onClick,
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        bg-surface rounded-2xl shadow-sm border border-border/50
        ${paddingStyles[padding]}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}