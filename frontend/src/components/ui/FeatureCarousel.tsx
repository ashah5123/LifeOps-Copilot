"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface FeatureCardData {
  category: string;
  title: string;
  description: string;
  image: string;
  color: string;
  content: React.ReactNode;
}

function FeatureCard({ card, index, onClick }: { card: FeatureCardData; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="flex-shrink-0 w-64 cursor-pointer group"
    >
      <div className="relative h-40 rounded-2xl overflow-hidden mb-3 border border-border">
        <div className="absolute inset-0" style={{ background: card.color }} />
        <img src={card.image} alt={card.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{card.category}</span>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-2">{card.title}</h3>
      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{card.description}</p>
    </motion.div>
  );
}

export default function FeatureCarousel({ cards }: { cards: FeatureCardData[] }) {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -280 : 280;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => scroll("left")} className="p-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors cursor-pointer">
              <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
            </button>
            <button onClick={() => scroll("right")} className="p-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors cursor-pointer">
              <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-none pb-2" style={{ scrollbarWidth: "none" }}>
          {cards.map((card, i) => (
            <FeatureCard key={i} card={card} index={i} onClick={() => setActiveCard(i)} />
          ))}
        </div>
      </div>

      {/* Expanded card modal */}
      <AnimatePresence>
        {activeCard !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setActiveCard(null)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.3 }} className="fixed inset-4 md:inset-12 z-50 overflow-y-auto rounded-3xl bg-surface border border-border">
              <div className="sticky top-0 z-10 flex justify-end p-4">
                <button onClick={() => setActiveCard(null)} className="p-2 rounded-full bg-surface-hover/80 backdrop-blur hover:bg-surface-hover cursor-pointer">
                  <XMarkIcon className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="px-6 md:px-12 pb-12 -mt-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">{cards[activeCard].category}</span>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary mt-2 mb-6">{cards[activeCard].title}</h2>
                {cards[activeCard].content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
