"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  InboxIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import type { FeedItem } from "@/types";

const categoryIcons = {
  inbox: InboxIcon,
  career: BriefcaseIcon,
  calendar: CalendarDaysIcon,
  budget: BanknotesIcon,
};

const categoryColors = {
  inbox: "bg-blue-100 text-blue-600",
  career: "bg-purple-100 text-purple-600",
  calendar: "bg-green-100 text-green-600",
  budget: "bg-amber-100 text-amber-600",
};

export default function TodayFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const Icon = categoryIcons[item.category];
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
          >
            <Link href={item.actionUrl}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[item.category]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-text-primary flex-1 line-clamp-1">{item.text}</p>
                <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.actionLabel} →
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
