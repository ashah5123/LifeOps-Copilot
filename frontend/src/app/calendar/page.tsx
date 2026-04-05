"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
<<<<<<< HEAD
  SparklesIcon,
  PlusIcon,
=======
  PlusIcon,
  SparklesIcon,
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
  ClockIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
<<<<<<< HEAD
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
=======
import Modal from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store";
import { mockCalendarEvents, mockAISuggestedSlots } from "@/lib/mock-data";
import type { CalendarEvent } from "@/types";

const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

function getWeekDays(startDate: Date) {
  const days = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function getEventsForDay(events: CalendarEvent[], date: Date) {
  return events.filter((e) => e.date === formatDateKey(date));
}

function getEventTop(startTime: string) {
  const [h, m] = startTime.split(":").map(Number);
  return ((h - 7) * 64) + (m / 60) * 64;
}

function getEventHeight(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max((diff / 60) * 64, 24);
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 7)); // April 7, 2026
  const [showAddModal, setShowAddModal] = useState(false);
  const weekDays = getWeekDays(currentDate);
  const addToast = useAppStore((s) => s.addToast);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const today = () => setCurrentDate(new Date(2026, 3, 7));
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
<<<<<<< HEAD
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
=======
            <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {weekDays[0].toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={today}>Today</Button>
            <div className="flex items-center gap-1">
              <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
              </button>
              <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />} size="sm">
              Add Event
            </Button>
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
<<<<<<< HEAD
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
=======
          {/* Weekly Calendar */}
          <div className="lg:col-span-3">
            <Card padding="sm" className="overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-8 border-b border-border">
                <div className="p-2 text-xs text-text-secondary" /> {/* Time gutter */}
                {weekDays.map((day) => {
                  const isToday = formatDateKey(day) === "2026-04-07";
                  return (
                    <div key={day.toISOString()} className="p-2 text-center border-l border-border/50">
                      <p className="text-xs text-text-secondary">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <p className={`text-lg font-semibold mt-0.5 ${isToday ? "text-primary" : "text-text-primary"}`}>
                        {day.getDate()}
                        {isToday && <span className="block w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-0.5" />}
                      </p>
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
                    </div>
                  );
                })}
              </div>
<<<<<<< HEAD
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
=======

              {/* Time Grid */}
              <div className="overflow-y-auto max-h-[600px]">
                <div className="grid grid-cols-8 relative" style={{ minHeight: hours.length * 64 }}>
                  {/* Hour lines */}
                  <div className="col-span-8 absolute inset-0">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="absolute w-full border-t border-border/30"
                        style={{ top: (hour - 7) * 64 }}
                      />
                    ))}
                  </div>

                  {/* Time labels */}
                  <div className="relative">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="absolute text-xs text-text-secondary pr-2 text-right w-full"
                        style={{ top: (hour - 7) * 64 - 8 }}
                      >
                        {hour === 0 ? "12 AM" : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDay(mockCalendarEvents, day);
                    return (
                      <div key={day.toISOString()} className="relative border-l border-border/30">
                        {dayEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden cursor-pointer"
                            style={{
                              top: getEventTop(event.startTime),
                              height: getEventHeight(event.startTime, event.endTime),
                              backgroundColor: event.color ? `${event.color}20` : "#4DA3FF20",
                              borderLeft: `3px solid ${event.color || "#4DA3FF"}`,
                            }}
                          >
                            <p className="text-[10px] font-medium truncate" style={{ color: event.color || "#4DA3FF" }}>
                              {event.title}
                            </p>
                            <p className="text-[10px] text-text-secondary truncate">
                              {event.startTime} - {event.endTime}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })}
                </div>
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
              </div>
            </Card>
          </div>

<<<<<<< HEAD
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
=======
          {/* AI Suggested Slots */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">AI Suggestions</h2>
            </div>
            <div className="space-y-3">
              {mockAISuggestedSlots.map((slot, index) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card padding="sm" hover>
                    <h3 className="text-sm font-medium text-text-primary mb-1">{slot.title}</h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClockIcon className="w-3.5 h-3.5 text-text-secondary" />
                      <p className="text-xs text-text-secondary">
                        {new Date(slot.suggestedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {slot.suggestedTime}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary mb-3 leading-relaxed">{slot.reason}</p>
                    <Button variant="ghost" size="sm">Add to Calendar</Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Event Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Event">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowAddModal(false);
              addToast({ message: "Event added!", type: "success" });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Study Session"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="event">Event</option>
                  <option value="task">Task</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Start Time</label>
                <input
                  type="time"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">End Time</label>
                <input
                  type="time"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
              <textarea
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Event
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
