"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

export interface AppleCarouselCardData {
  category: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

function Card({
  card,
  index,
  onOpen,
}: {
  card: AppleCarouselCardData;
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      onClick={onOpen}
      className="group flex h-full min-h-[240px] w-full flex-col rounded-2xl border border-border bg-gradient-to-b from-primary/[0.08] via-surface to-violet-500/[0.06] p-5 text-left shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:min-h-[260px] md:min-h-[280px]"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
        {card.category}
      </span>
      <h3 className="mt-3 text-base font-bold leading-snug text-text-primary md:text-lg md:leading-tight">
        {card.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary md:text-base md:leading-relaxed">
        {card.description}
      </p>
      <span className="mt-4 text-xs font-medium text-primary/90 opacity-0 transition-opacity group-hover:opacity-100">
        Learn more →
      </span>
    </motion.button>
  );
}

export default function AppleCardsCarousel({ cards }: { cards: AppleCarouselCardData[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      {/* Responsive grid: all cards visible — 1 col → 2 → 3 → 5 (no clipped carousel) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {cards.map((card, index) => (
          <Card
            key={`${card.category}-${card.title}`}
            card={card}
            index={index}
            onOpen={() => setActive(index)}
          />
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setActive(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-4 z-50 flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl md:inset-12"
            >
              <div className="flex justify-end border-b border-border p-3">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="cursor-pointer rounded-full p-2 hover:bg-surface-hover"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5 text-text-secondary" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-10 pt-2 md:px-12">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {cards[active].category}
                </span>
                <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-text-primary md:text-3xl">
                  {cards[active].title}
                </h2>
                <div className="mt-8 space-y-6 text-base leading-relaxed text-text-secondary md:text-lg [&_strong]:font-semibold [&_strong]:text-text-primary">
                  {cards[active].content}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
