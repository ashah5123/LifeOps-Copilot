"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  InboxIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import UploadBox from "@/components/upload/UploadBox";
import TodayFeed from "@/components/feed/TodayFeed";
import MovingBorderCard from "@/components/ui/MovingBorderCard";
import TypewriterGreeting from "@/components/ui/TypewriterGreeting";
import { useAppStore } from "@/lib/store";
import { getDashboardSummary, getTodayFeed } from "@/lib/api";
import { mockDashboardSummary, mockFeedItems } from "@/lib/mock-data";
import type { DashboardSummary, FeedItem } from "@/types";

/* ============================================
   LINEAR-STYLE LIVE ANIMATED CARD SCENES
   ============================================ */

function LiveMailScene() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/5 rounded-xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-orbit" style={{ animationDuration: "6s" }}>
          <div className="w-2 h-2 rounded-full bg-blue-400/60" />
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-orbit" style={{ animationDuration: "8s", animationDelay: "2s" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/40" />
        </div>
      </div>
      <div className="relative">
        <motion.div animate={{ y: [0, -3, 0], rotate: [-2, 0, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-2 -left-3 w-16 h-10 bg-blue-500/8 border border-blue-500/15 rounded-lg" />
        <motion.div animate={{ y: [0, -5, 0], rotate: [1, -1, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -top-1 left-0 w-16 h-10 bg-blue-500/12 border border-blue-500/20 rounded-lg" />
        <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="relative w-16 h-10 bg-gradient-to-br from-blue-500/25 to-indigo-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="text-blue-400">
            <rect x="0.5" y="0.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1" />
            <path d="M1 1l9 6 9-6" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          </svg>
        </motion.div>
      </div>
      <div className="absolute bottom-3 right-3 w-3 h-3">
        <span className="absolute inset-0 rounded-full bg-blue-400/40 animate-ping" />
        <span className="relative block w-3 h-3 rounded-full bg-blue-400" />
      </div>
    </div>
  );
}

function LiveDeadlineScene() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 to-pink-600/5 rounded-xl" />
      <div className="relative">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="24" stroke="rgba(244,63,94,0.2)" strokeWidth="1.5" />
          <circle cx="28" cy="28" r="20" stroke="rgba(244,63,94,0.1)" strokeWidth="1" strokeDasharray="3 3" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line key={deg} x1="28" y1="6" x2="28" y2="9" stroke="rgba(244,63,94,0.3)" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${deg} 28 28)`} />
          ))}
          <line x1="28" y1="28" x2="28" y2="12" stroke="rgba(244,63,94,0.6)" strokeWidth="1.5" strokeLinecap="round"
            style={{ transformOrigin: "28px 28px", animation: "rotate-hand 8s linear infinite" }} />
          <line x1="28" y1="28" x2="28" y2="16" stroke="rgba(244,63,94,0.9)" strokeWidth="2" strokeLinecap="round"
            style={{ transformOrigin: "28px 28px", animation: "rotate-hand 24s linear infinite" }} />
          <circle cx="28" cy="28" r="2.5" fill="rgba(244,63,94,0.8)" />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 animate-pulse-glow" />
      </div>
      <div className="absolute top-3 right-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
        </span>
      </div>
    </div>
  );
}

function LiveTaskScene() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-green-600/5 rounded-xl" />
      <div className="flex flex-col gap-2">
        {[
          { w: "w-20", delay: 0, done: true },
          { w: "w-16", delay: 0.3, done: true },
          { w: "w-24", delay: 0.6, done: false },
          { w: "w-14", delay: 0.9, done: false },
        ].map((bar, i) => (
          <motion.div key={i} initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: bar.delay, ease: "easeOut" as const }} className="flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, delay: bar.delay + 1, repeat: Infinity, repeatDelay: 3 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" />
                {bar.done && <path d="M4 7l2 2 4-4" stroke="rgba(34,197,94,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </motion.div>
            <div className={`h-2 ${bar.w} rounded-full bg-emerald-500/20`}>
              {bar.done && <div className="h-full rounded-full bg-emerald-400/40 w-full" />}
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
        className="absolute top-4 right-4 text-emerald-400"><SparklesIcon className="w-4 h-4" /></motion.div>
    </div>
  );
}

function LiveBudgetScene() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-orange-600/5 rounded-xl" />
      <div className="flex items-end gap-1.5 h-16">
        {[60, 45, 80, 35, 70, 55, 90].map((height, i) => (
          <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${height}%` }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" as const }}
            className="w-3 rounded-t-sm"
            style={{ background: i === 6 ? "linear-gradient(to top, rgba(245,158,11,0.4), rgba(245,158,11,0.8))" : "rgba(245,158,11,0.2)" }} />
        ))}
      </div>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute top-4 right-4">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
          <span className="text-xs font-bold text-amber-400">$</span>
        </div>
      </motion.div>
      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-amber-400" />
    </div>
  );
}

/* ============================================
   QUICK ACCESS — LINEAR-STYLE MINI SCENES
   ============================================ */

function InboxMiniScene() {
  return (
    <div className="relative mb-2 h-14 w-full overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/4" />
      <div className="absolute inset-0 flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} animate={{ y: [0, -3, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-10 h-6 bg-blue-500/10 border border-blue-500/15 rounded-md" />
        ))}
      </div>
      <motion.div animate={{ x: [-20, 60] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-2 left-0 w-8 h-[2px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
    </div>
  );
}

function CareerMiniScene() {
  return (
    <div className="relative mb-2 h-14 w-full overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-purple-500/4" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} initial={{ width: 0 }} animate={{ width: [0, 40 - i * 8, 40 - i * 8] }}
              transition={{ duration: 1.5, delay: 0.3 + i * 0.2, repeat: Infinity, repeatDelay: 3 }}
              className="h-1.5 bg-violet-400/30 rounded-full" />
          ))}
        </div>
      </div>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60" />
      </motion.div>
    </div>
  );
}

function CalendarMiniScene() {
  return (
    <div className="relative mb-2 h-14 w-full overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-green-500/4" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div key={i}
              animate={{ opacity: [0.15, i === 7 || i === 12 ? 0.7 : 0.3, 0.15] }}
              transition={{ duration: 2, delay: i * 0.08, repeat: Infinity }}
              className={`w-3 h-3 rounded-sm ${i === 7 ? 'bg-emerald-400/60' : i === 12 ? 'bg-emerald-400/40' : 'bg-emerald-500/15'} border border-emerald-500/10`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BudgetMiniScene() {
  return (
    <div className="relative mb-2 h-14 w-full overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 to-orange-500/4" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none">
          <motion.path
            d="M5 35 L15 25 L25 28 L35 15 L45 20 L55 8"
            stroke="rgba(245,158,11,0.5)" strokeWidth="2" strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M5 35 L15 25 L25 28 L35 15 L45 20 L55 8 L55 40 L5 40 Z"
            fill="rgba(245,158,11,0.05)"
            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </svg>
      </div>
    </div>
  );
}

/* ============ DATA ============ */

const allQuotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", tag: "productivity" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", tag: "motivation" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", tag: "career" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", tag: "education" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", tag: "life" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", tag: "motivation" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", tag: "dreams" },
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey", tag: "budget" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett", tag: "budget" },
  { text: "The best investment you can make is in yourself.", author: "Warren Buffett", tag: "career" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser", tag: "career" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", tag: "productivity" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", tag: "productivity" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson", tag: "career" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", tag: "education" },
  { text: "Time is what we want most, but what we use worst.", author: "William Penn", tag: "productivity" },
  { text: "Beware of little expenses. A small leak will sink a great ship.", author: "Benjamin Franklin", tag: "budget" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", tag: "motivation" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", tag: "career" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", tag: "motivation" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", tag: "life" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki", tag: "budget" },
  { text: "Your career is a marathon, not a sprint. Be patient and persistent.", author: "Unknown", tag: "career" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes", tag: "education" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs", tag: "motivation" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn", tag: "productivity" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss", tag: "productivity" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum", tag: "budget" },
  { text: "Choose a job you love, and you will never have to work a day in your life.", author: "Confucius", tag: "career" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert", tag: "education" },
];

const tagColors: Record<string, string> = {
  productivity: "text-blue-700 dark:text-blue-400",
  motivation: "text-violet-700 dark:text-violet-400",
  career: "text-emerald-700 dark:text-emerald-400",
  education: "text-amber-800 dark:text-amber-400",
  life: "text-rose-700 dark:text-rose-400",
  dreams: "text-indigo-700 dark:text-indigo-400",
  budget: "text-orange-700 dark:text-orange-400",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function getMSTGreeting(): string {
  const utc = new Date();
  const mstHour = new Date(utc.toLocaleString("en-US", { timeZone: "America/Phoenix" })).getHours();
  if (mstHour < 12) return "Good morning";
  if (mstHour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const agentFeedItems = useAppStore((s) => s.agentFeedItems);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const [greeting] = useState(() => getMSTGreeting());
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * allQuotes.length));
  const [stats, setStats] = useState<DashboardSummary>(() => ({ ...mockDashboardSummary }));
  const [apiFeedSlice, setApiFeedSlice] = useState<FeedItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const summary = await getDashboardSummary();
        if (!cancelled) setStats(summary as DashboardSummary);
      } catch {
        /* keep mock */
      }
      try {
        const feed = await getTodayFeed();
        if (cancelled || !Array.isArray(feed) || feed.length === 0) return;
        setApiFeedSlice(feed);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const realFeedItems: FeedItem[] = agentFeedItems.map((it) => ({
    id: it.id,
    text: it.text,
    category: it.category,
    actionLabel: it.actionLabel,
    actionUrl: it.actionUrl,
    timestamp: it.timestamp,
  }));

  const combinedFeed = useMemo(
    () => [...realFeedItems, ...apiFeedSlice, ...mockFeedItems].slice(0, 12),
    [realFeedItems, apiFeedSlice],
  );

  const heroCards = useMemo(
    () => [
      { label: "Emails to Reply", value: stats.emailsNeedingReply, scene: LiveMailScene, accent: "border-blue-500/30" },
      { label: "Upcoming Deadlines", value: stats.deadlines, scene: LiveDeadlineScene, accent: "border-rose-500/30" },
      { label: "Tasks Today", value: stats.tasksToday, scene: LiveTaskScene, accent: "border-emerald-500/30" },
      { label: "Budget Alerts", value: stats.budgetAlerts, scene: LiveBudgetScene, accent: "border-amber-500/30" },
    ],
    [stats],
  );

  const smartCards = useMemo(
    () => [
      {
        title: "Inbox",
        insight: stats.inboxInsight,
        count: stats.emailsNeedingReply,
        icon: InboxIcon,
        href: "/inbox",
        gradient: "from-blue-500 to-indigo-600",
        glow: "shadow-blue-500/20",
        miniScene: InboxMiniScene,
      },
      {
        title: "Career",
        insight: stats.careerInsight,
        count: stats.careerTracked ?? stats.tasksToday,
        icon: BriefcaseIcon,
        href: "/career",
        gradient: "from-violet-500 to-purple-600",
        glow: "shadow-violet-500/20",
        miniScene: CareerMiniScene,
      },
      {
        title: "Calendar",
        insight: stats.calendarInsight,
        count: stats.deadlines,
        icon: CalendarDaysIcon,
        href: "/calendar",
        gradient: "from-emerald-500 to-green-600",
        glow: "shadow-emerald-500/20",
        miniScene: CalendarMiniScene,
      },
      {
        title: "Budget",
        insight: stats.budgetInsight,
        count: stats.budgetAlerts,
        icon: BanknotesIcon,
        href: "/budget",
        gradient: "from-amber-500 to-orange-600",
        glow: "shadow-amber-500/20",
        miniScene: BudgetMiniScene,
      },
    ],
    [stats],
  );

  // Rotate quotes every 20 seconds (blur / flip style)
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % allQuotes.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = allQuotes[quoteIndex];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="max-w-4xl text-2xl font-bold tracking-tight md:text-4xl">
            <TypewriterGreeting
              text={`${greeting}, ${firstName}`}
              className="inline-block bg-gradient-to-r from-amber-500 via-sky-500 to-violet-500 bg-clip-text text-transparent animate-shimmer-text bg-[length:220%_auto]"
            />
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Here&apos;s what needs your attention today
          </p>
        </motion.div>

        {/* Rotating Quote Card — Moving Border */}
        <MovingBorderCard duration={8} borderRadius="1.75rem" className="w-full">
          <div className="relative px-6 py-5">
            <div className="absolute top-3 left-4 text-indigo-600/90 dark:text-primary/35">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <div className="ml-8 min-h-[52px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, rotateX: -18, filter: "blur(10px)", y: 8 }}
                  animate={{ opacity: 1, rotateX: 0, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, rotateX: 16, filter: "blur(10px)", y: -8 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformPerspective: 800 }}
                >
                  <p className="text-sm font-medium italic leading-relaxed text-zinc-900 md:text-base dark:text-text-primary">
                    &ldquo;{currentQuote.text}&rdquo;
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <p className="text-xs font-medium text-zinc-600 dark:text-text-secondary">— {currentQuote.author}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${tagColors[currentQuote.tag] || "text-zinc-600 dark:text-text-secondary"}`}>
                      #{currentQuote.tag}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="absolute bottom-3 right-4 rotate-180 text-indigo-600/80 dark:text-primary/25">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            {/* Progress bar showing time to next quote */}
            <motion.div
              key={`bar-${quoteIndex}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 20, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/35 origin-left"
            />
          </div>
        </MovingBorderCard>

        {/* Hero Stat Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {heroCards.map((card) => {
            const Scene = card.scene;
            return (
              <motion.div key={card.label} variants={item}>
                <motion.div whileHover={{ y: -4, scale: 1.025 }} transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`bg-surface border ${card.accent} rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300`}>
                  <Scene />
                  <div className="px-4 pb-4 pt-2 text-center">
                    <p className="text-3xl font-bold text-text-primary tracking-tight">{card.value}</p>
                    <p className="text-xs text-text-secondary font-medium mt-0.5">{card.label}</p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Upload Box */}
        <motion.div variants={item} initial="hidden" animate="show">
          <UploadBox />
        </motion.div>

        {/* Quick Access (with mini animated scenes) + Today Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-text-primary mb-4 tracking-tight">Quick Access</h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid origin-top scale-[0.94] grid-cols-1 gap-3 sm:grid-cols-2 sm:scale-[0.96] sm:gap-3.5"
            >
              {smartCards.map((card) => {
                const MiniScene = card.miniScene;
                return (
                  <motion.div key={card.title} variants={item}>
                    <Link href={card.href} className="block">
                      <Card hover padding="sm" className="group">
                        <MiniScene />

                        <div className="mb-1.5 flex items-start justify-between">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${card.gradient} shadow-md ${card.glow}`}>
                            <card.icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="rounded-full border border-border bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                            {card.count} items
                          </span>
                        </div>
                        <h3 className="mb-0.5 text-sm font-semibold text-text-primary">{card.title}</h3>
                        <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-text-secondary">{card.insight}</p>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-primary transition-all group-hover:gap-1.5">
                          Open <ArrowRightIcon className="h-3 w-3" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4 tracking-tight">Today&apos;s Actions</h2>
            <Card padding="sm">
              <TodayFeed items={combinedFeed} />
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
