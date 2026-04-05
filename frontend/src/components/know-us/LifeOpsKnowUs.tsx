"use client";

import AppleCardsCarousel from "@/components/ui/AppleCardsCarousel";
import type { AppleCarouselCardData } from "@/components/ui/AppleCardsCarousel";

export const lifeOpsCards: AppleCarouselCardData[] = [
  {
    category: "Budget",
    title: "Know where every dollar goes",
    description: "Smart categories, alerts, and weekly rollups tuned for student life.",
    content: (
      <div className="space-y-6">
        <p>
          <strong className="text-text-primary">Build clarity, not spreadsheets.</strong> LifeOps groups dining, subscriptions, and campus spending so you see trends before they become surprises.
        </p>
        <p>
          Set soft limits per category, get nudges when you drift from your plan, and see projected balances through the end of the month — especially around tuition, rent, and books.
        </p>
        <p>
          Weekly rollups explain what moved and why, in plain language, so you can adjust in minutes instead of reconciling for hours.
        </p>
      </div>
    ),
  },
  {
    category: "Job board",
    title: "Career pipeline in one place",
    description: "Roles, deadlines, and AI nudges so you never miss a screen.",
    content: (
      <div className="space-y-6">
        <p>
          <strong className="text-text-primary">One pipeline for every application.</strong> Track company, role, stage, and next action in a single view designed for recruiting season.
        </p>
        <p>
          Deadlines surface next to your calendar so prep blocks and submissions do not collide with exams or project due dates.
        </p>
        <p>
          Gentle nudges remind you to follow up after screens and to refresh materials when a role stalls — without the noise of a generic job board.
        </p>
      </div>
    ),
  },
  {
    category: "Calendar",
    title: "Time blocks that respect real life",
    description: "Week view, AI slots, and quick-add from the grid.",
    content: (
      <div className="space-y-6">
        <p>
          <strong className="text-text-primary">Your week, grounded in reality.</strong> See classes, study blocks, and interviews together so you never double-book deep work with office hours again.
        </p>
        <p>
          Quick-add from any cell puts events where they belong; suggested slots respect travel, meals, and the focus time you still need before big deadlines.
        </p>
        <p>
          When conflicts appear, LifeOps highlights them immediately so you fix the plan before the day unravels.
        </p>
      </div>
    ),
  },
  {
    category: "Inbox",
    title: "Inbox zero without the anxiety",
    description: "Triage, drafts, and professor-ready tone in seconds.",
    content: (
      <div className="space-y-6">
        <p>
          <strong className="text-text-primary">Triage that respects your voice.</strong> Threads are summarized with next steps so you know what matters before you open a novel-length chain.
        </p>
        <p>
          Draft replies match a professional, professor-ready tone — editable in one pass — so you answer faster without sounding rushed.
        </p>
        <p>
          Labels and follow-up suggestions keep financial aid, career, and course emails separated without maintaining a maze of filters.
        </p>
      </div>
    ),
  },
  {
    category: "AI",
    title: "Assistant that knows your context",
    description: "Grounded in your tasks, mail, and schedule — not generic tips.",
    content: (
      <div className="space-y-6">
        <p>
          <strong className="text-text-primary">Context from your actual life.</strong> The assistant reads across inbox, calendar, and tasks so answers reference what is on your plate this week — not boilerplate advice.
        </p>
        <p>
          Ask for a prep brief before a call, a rewrite that fits academic tone, or a prioritized list for tonight — each answer stays short and actionable.
        </p>
        <p>
          When plans shift, LifeOps reframes suggestions automatically so you are never working from yesterday&apos;s stale checklist.
        </p>
      </div>
    ),
  },
];

/**
 * Full “Get to know what is LifeOps” block (carousel + copy). Used on /know-us.
 */
export default function LifeOpsKnowUs() {
  return (
    <section className="rounded-2xl border border-border/80 bg-surface/60 p-5 shadow-sm backdrop-blur-sm md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-text-primary md:text-2xl">
          Get to know what is LifeOps
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
          A Linear-inspired command center for student life — tap a card to explore each pillar.
        </p>
      </div>
      <AppleCardsCarousel cards={lifeOpsCards} />
    </section>
  );
}
