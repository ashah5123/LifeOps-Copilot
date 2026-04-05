"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  PlusIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { mockCalendarEvents, mockAISuggestedSlots } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const addToast = useAppStore((s) => s.addToast);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(baseDate);
  const today = formatDateStr(new Date());

  const weekLabel = `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Calendar</h1>
            <p className="text-sm text-text-secondary mt-0.5">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="p-2 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer border border-border">
              <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-surface-hover transition-colors cursor-pointer border border-border text-text-secondary">
              Today
            </button>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="p-2 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer border border-border">
              <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card padding="none" className="overflow-hidden">
              <div className="grid grid-cols-8 border-b border-border">
                <div className="p-3 text-xs text-text-secondary font-medium" />
                {weekDates.map((date, i) => {
                  const isToday = formatDateStr(date) === today;
                  return (
                    <div key={i} className="p-3 text-center border-l border-border">
                      <p className="text-xs text-text-secondary font-medium">{DAYS[i]}</p>
                      <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-primary" : "text-text-primary"}`}>{date.getDate()}</p>
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />}
                    </div>
                  );
                })}
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                {HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-b border-border/50 min-h-[56px]">
                    <div className="p-2 text-xs text-text-secondary font-medium text-right pr-3 pt-1">
                      {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                    </div>
                    {weekDates.map((date, dayIdx) => {
                      const dateStr = formatDateStr(date);
                      const events = mockCalendarEvents.filter(
                        (e) => e.date === dateStr && parseInt(e.startTime.split(":")[0]) === hour
                      );
                      return (
                        <div key={dayIdx} className="border-l border-border/50 p-1 relative">
                          {events.map((event) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-xs px-2 py-1.5 rounded-lg font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: `${event.color}20`,
                                color: event.color,
                                borderLeft: `3px solid ${event.color}`,
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{event.title}</span>
                              </div>
                              <span className="text-[10px] opacity-70">{event.startTime} - {event.endTime}</span>
                            </motion.div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">AI Suggested Slots</h2>
            </div>
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              {mockAISuggestedSlots.map((slot) => (
                <motion.div key={slot.id} variants={item}>
                  <Card padding="sm" hover glow>
                    <h3 className="text-sm font-medium text-text-primary mb-1">{slot.title}</h3>
                    <p className="text-xs text-text-secondary mb-2 leading-relaxed">{slot.reason}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="info">
                        {new Date(slot.suggestedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Badge>
                      <span className="text-xs text-text-secondary">{slot.suggestedTime}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<PlusIcon className="w-3.5 h-3.5" />}
                      onClick={() => addToast({ message: `"${slot.title}" added to calendar!`, type: "success" })}
                    >
                      Add to Calendar
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
