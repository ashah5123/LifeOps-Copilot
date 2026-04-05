"use client";

import React from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export interface FloatingDockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

interface FloatingDockProps {
  items: FloatingDockItem[];
  className?: string;
}

function DockIcon({
  mouseX,
  title,
  icon,
  href,
}: {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val) => {
    const el = ref.current?.getBoundingClientRect();
    if (!el) return 200;
    return val - el.x - el.width / 2;
  });
  const widthSync = useTransform(distance, [-120, 0, 120], [44, 56, 44]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 200, damping: 15 });

  return (
    <Link href={href} title={title} className="flex items-end">
      <motion.div
        ref={ref}
        style={{ width }}
        className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10"
      >
        <motion.div className="flex h-full w-full items-center justify-center [&_svg]:h-[55%] [&_svg]:w-[55%]">
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}

/** macOS-dock style hover magnification for compact icon rows. */
export default function FloatingDock({ items, className = "" }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`mx-auto flex h-14 items-end gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-xl ${className}`}
    >
      {items.map((item) => (
        <DockIcon key={item.title + item.href} mouseX={mouseX} {...item} />
      ))}
    </motion.div>
  );
}
