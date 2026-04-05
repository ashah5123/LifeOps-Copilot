"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import UploadBox from "@/components/upload/UploadBox";
import TodayFeed from "@/components/feed/TodayFeed";
import { useAppStore } from "@/lib/store";
import { mockDashboardSummary, mockFeedItems } from "@/lib/mock-data";

const heroCards = [
  {
    label: "Emails to Reply",
    value: mockDashboardSummary.emailsNeedingReply,
    icon: EnvelopeIcon,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    label: "Upcoming Deadlines",
    value: mockDashboardSummary.deadlines,
    icon: ClockIcon,
    color: "text-red-600",
    bg: "bg-red-100",
  },
  {
    label: "Tasks Today",
    value: mockDashboardSummary.tasksToday,
    icon: CheckCircleIcon,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    label: "Budget Alerts",
    value: mockDashboardSummary.budgetAlerts,
    icon: ExclamationTriangleIcon,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
];

const smartCards = [
  {
    title: "Inbox",
    insight: mockDashboardSummary.inboxInsight,
    count: mockDashboardSummary.emailsNeedingReply,
    icon: InboxIcon,
    href: "/inbox",
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Career",
    insight: mockDashboardSummary.careerInsight,
    count: 3,
    icon: BriefcaseIcon,
    href: "/career",
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Calendar",
    insight: mockDashboardSummary.calendarInsight,
    count: 4,
    icon: CalendarDaysIcon,
    href: "/calendar",
    color: "from-green-500 to-green-600",
  },
  {
    title: "Budget",
    insight: mockDashboardSummary.budgetInsight,
    count: mockDashboardSummary.budgetAlerts,
    icon: BanknotesIcon,
    href: "/budget",
    color: "from-amber-500 to-amber-600",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const displayName = user?.name || "there";
  const greeting = getTimeBasedGreeting();

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here&apos;s what needs your attention today
          </p>
        </div>

        {/* Hero Summary Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          {heroCards.map((card) => (
            <motion.div key={card.label} variants={item}>
              <Card hover padding="sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{card.value}</p>
                    <p className="text-xs text-text-secondary">{card.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Upload Box */}
        <motion.div variants={item} initial="hidden" animate="show">
          <UploadBox />
        </motion.div>

        {/* Smart Cards + Today Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Smart Cards */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Access</h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {smartCards.map((card) => (
                <motion.div key={card.title} variants={item}>
                  <Link href={card.href}>
                    <Card hover padding="md" className="group">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                          <card.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-text-secondary bg-gray-100 px-2 py-1 rounded-full">
                          {card.count} items
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-text-primary mb-1">{card.title}</h3>
                      <p className="text-xs text-text-secondary line-clamp-2 mb-3">{card.insight}</p>
                      <div className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                        Open <ArrowRightIcon className="w-3 h-3" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Today Feed */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Today&apos;s Actions</h2>
            <Card padding="sm">
              <TodayFeed items={mockFeedItems} />
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
