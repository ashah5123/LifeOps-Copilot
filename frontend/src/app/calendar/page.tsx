"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SparklesIcon,
  ClockIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store";
import { mockCalendarEvents, mockAISuggestedSlots } from "@/lib/mock-data";
import type { CalendarEvent } from "@/types";
import {
  listCalendarEvents,
  createCalendarEvent,
  suggestStudyBlocks,
  getUpcomingDeadlines,
  getCalendarProductivityTips,
} from "@/lib/api";

function apiEventToCalendarEvent(e: Record<string, unknown>): CalendarEvent {
  const time = String(e.time ?? "09:00").slice(0, 5);
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10) || 9;
  const m = parseInt(mStr, 10) || 0;
  const endH = Math.min(h + 1, 23);
  const endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const et = String(e.event_type ?? "other");
  const type: CalendarEvent["type"] =
    et === "exam" || et === "deadline"
      ? "deadline"
      : et === "task" || et === "study"
        ? "task"
        : "event";
  const colors: Record<CalendarEvent["type"], string> = {
    event: "#4DA3FF",
    task: "#22C55E",
    deadline: "#F59E0B",
  };
  return {
    id: String(e.id),
    title: String(e.title ?? "Event"),
    date: String(e.date ?? "").slice(0, 10),
    startTime: time,
    endTime,
    type,
    description: e.notes ? String(e.notes) : undefined,
    color: colors[type],
  };
}

function calendarTypeToEventType(t: CalendarEvent["type"]): string {
  if (t === "deadline") return "deadline";
  if (t === "task") return "task";
  return "other";
}

const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

const TYPE_BADGE_VARIANT: Record<CalendarEvent["type"], "info" | "success" | "warning"> = {
  event: "info",
  task: "success",
  deadline: "warning",
};

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
  return (h - 7) * 64 + (m / 60) * 64;
}

function getEventHeight(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return Math.max((diff / 60) * 64, 24);
}

function formatTime12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function toGoogleCalendarUrl(event: CalendarEvent) {
  const dateClean = event.date.replace(/-/g, "");
  const startISO = `${dateClean}T${event.startTime.replace(":", "")}00`;
  const endISO = `${dateClean}T${event.endTime.replace(":", "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startISO}/${endISO}`,
    details: event.description || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toICSDataUri(event: CalendarEvent) {
  const dateClean = event.date.replace(/-/g, "");
  const startISO = `${dateClean}T${event.startTime.replace(":", "")}00`;
  const endISO = `${dateClean}T${event.endTime.replace(":", "")}00`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SparkUp//EN",
    "BEGIN:VEVENT",
    `DTSTART:${startISO}`,
    `DTEND:${endISO}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [apiSlots, setApiSlots] = useState<typeof mockAISuggestedSlots>([]);
  const [deadlineHint, setDeadlineHint] = useState<string | null>(null);
  const [productivityHint, setProductivityHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listCalendarEvents();
        if (cancelled) return;
        if (rows.length) {
          setEvents(rows.map((r) => apiEventToCalendarEvent(r as Record<string, unknown>)));
        } else {
          setEvents(mockCalendarEvents);
        }
      } catch {
        if (!cancelled) setEvents(mockCalendarEvents);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!events.length) return;
    const payload = events.map((ev) => ({
      date: ev.date,
      start_time: ev.startTime,
      end_time: ev.endTime,
    }));
    suggestStudyBlocks(payload)
      .then((blocks) => {
        if (!Array.isArray(blocks)) return;
        const slots: typeof mockAISuggestedSlots = blocks.slice(0, 8).map((b, i) => {
          const row = b as Record<string, unknown>;
          const d = String(row.date ?? "");
          const st = String(row.start_time ?? "14:00").slice(0, 5);
          return {
            id: `api-slot-${i}-${d}-${st}`,
            title: String(row.label ?? "Study block"),
            suggestedDate: d,
            suggestedTime: st,
            reason: `${String(row.day_of_week ?? "")} · ${String(row.duration_hours ?? 2)}h suggested focus`,
          };
        });
        setApiSlots(slots);
      })
      .catch(() => setApiSlots([]));
  }, [events]);

  useEffect(() => {
    getUpcomingDeadlines(14)
      .then((d) => {
        const n = (d as { count?: number }).count ?? 0;
        setDeadlineHint(n > 0 ? `${n} upcoming deadlines in the next 14 days (backend).` : null);
      })
      .catch(() => setDeadlineHint(null));
    getCalendarProductivityTips()
      .then((t) => {
        const tips = (t as { tips?: { title?: string; detail?: string }[] }).tips;
        const first = tips?.[0];
        if (first?.detail) setProductivityHint(`${first.title ?? "Tip"}: ${first.detail}`);
        else setProductivityHint(null);
      })
      .catch(() => setProductivityHint(null));
  }, []);

  // Add Event form state
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newType, setNewType] = useState<CalendarEvent["type"]>("event");
  const [newDescription, setNewDescription] = useState("");

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

  const today = () => setCurrentDate(new Date());

  const resetForm = () => {
    setNewTitle("");
    setNewDate("");
    setNewStartTime("");
    setNewEndTime("");
    setNewType("event");
    setNewDescription("");
  };

  const suggestedSlots = useMemo(() => [...mockAISuggestedSlots, ...apiSlots], [apiSlots]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const color =
      newType === "event" ? "#4DA3FF" : newType === "task" ? "#22C55E" : "#F59E0B";
    try {
      const created = await createCalendarEvent({
        title: newTitle,
        date: newDate,
        time: newStartTime.slice(0, 5),
        event_type: calendarTypeToEventType(newType),
        notes: newDescription || null,
      });
      const base = apiEventToCalendarEvent(created as Record<string, unknown>);
      const newEvent: CalendarEvent = {
        ...base,
        startTime: newStartTime.slice(0, 5),
        endTime: newEndTime.slice(0, 5),
        color,
      };
      setEvents((prev) => [...prev, newEvent]);
    } catch {
      const newEvent: CalendarEvent = {
        id: `e-${Date.now()}`,
        title: newTitle,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        type: newType,
        description: newDescription || undefined,
        color,
      };
      setEvents((prev) => [...prev, newEvent]);
      addToast({ message: "Saved locally; API unavailable", type: "warning" });
    }
    setShowAddModal(false);
    resetForm();
    addToast({ message: "Event added!", type: "success" });
  };

  const handleAddSuggestion = (slot: {
    id: string;
    title: string;
    suggestedDate: string;
    suggestedTime: string;
    reason: string;
  }) => {
    const [h] = slot.suggestedTime.split(":").map(Number);
    const endHour = h + 1;
    const newEvent: CalendarEvent = {
      id: `e-ai-${slot.id}-${Date.now()}`,
      title: slot.title,
      date: slot.suggestedDate,
      startTime: slot.suggestedTime,
      endTime: `${endHour.toString().padStart(2, "0")}:00`,
      type: "event",
      color: "#8B5CF6",
      description: slot.reason,
    };
    setEvents((prev) => [...prev, newEvent]);
    addToast({ message: `"${slot.title}" added to calendar!`, type: "success" });
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {weekDays[0].toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={today}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <button
                onClick={prevWeek}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
              </button>
              <button
                onClick={nextWeek}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              icon={<PlusIcon className="w-4 h-4" />}
              size="sm"
            >
              Add Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Weekly Calendar */}
          <div className="lg:col-span-3">
            <Card padding="sm" className="overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-8 border-b border-border">
                <div className="p-2 text-xs text-text-secondary" />
                {weekDays.map((day) => {
                  const isToday = formatDateKey(day) === formatDateKey(new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      className="p-2 text-center border-l border-border/50"
                    >
                      <p className="text-xs text-text-secondary">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <p
                        className={`text-lg font-semibold mt-0.5 ${
                          isToday ? "text-primary" : "text-text-primary"
                        }`}
                      >
                        {day.getDate()}
                        {isToday && (
                          <span className="block w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-0.5" />
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time Grid */}
              <div className="overflow-y-auto max-h-[600px]">
                <div
                  className="grid grid-cols-8 relative"
                  style={{ minHeight: hours.length * 64 }}
                >
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
                        {hour === 0
                          ? "12 AM"
                          : hour <= 12
                          ? `${hour} AM`
                          : `${hour - 12} PM`}
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDay(events, day);
                    return (
                      <div
                        key={day.toISOString()}
                        className="relative border-l border-border/30"
                      >
                        {dayEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              top: getEventTop(event.startTime),
                              height: getEventHeight(
                                event.startTime,
                                event.endTime
                              ),
                              backgroundColor: event.color
                                ? `${event.color}20`
                                : "#4DA3FF20",
                              borderLeft: `3px solid ${
                                event.color || "#4DA3FF"
                              }`,
                            }}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <p
                              className="text-[10px] font-medium truncate"
                              style={{ color: event.color || "#4DA3FF" }}
                            >
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
              </div>
            </Card>
          </div>

          {/* AI Suggested Slots */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">
                AI Suggestions
              </h2>
            </div>
            {(deadlineHint || productivityHint) && (
              <div className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80">
                {deadlineHint && <p>{deadlineHint}</p>}
                {productivityHint && <p>{productivityHint}</p>}
              </div>
            )}
            <div className="space-y-3">
              {suggestedSlots.map((slot, index) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card padding="sm" hover>
                    <h3 className="text-sm font-medium text-text-primary mb-1">
                      {slot.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClockIcon className="w-3.5 h-3.5 text-text-secondary" />
                      <p className="text-xs text-text-secondary">
                        {new Date(slot.suggestedDate).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }
                        )}{" "}
                        at {slot.suggestedTime}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                      {slot.reason}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddSuggestion(slot)}
                    >
                      Add to Calendar
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Detail Modal */}
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Event Details"
        >
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedEvent.title}
                </h3>
                <div className="mt-2">
                  <Badge variant={TYPE_BADGE_VARIANT[selectedEvent.type]}>
                    {selectedEvent.type.charAt(0).toUpperCase() +
                      selectedEvent.type.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>
                    {new Date(
                      selectedEvent.date + "T00:00:00"
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    {formatTime12(selectedEvent.startTime)} -{" "}
                    {formatTime12(selectedEvent.endTime)}
                  </span>
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-1">
                    Description
                  </p>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs font-medium text-text-secondary mb-2">
                  Add to external calendar
                </p>
                <div className="flex gap-2">
                  <a
                    href={toGoogleCalendarUrl(selectedEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Add to Google Calendar
                  </a>
                  <a
                    href={toICSDataUri(selectedEvent)}
                    download={`${selectedEvent.title.replace(/\s+/g, "_")}.ics`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-text-primary hover:bg-gray-200 transition-colors"
                  >
                    Add to Apple Calendar
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedEvent(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Event Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          title="Add Event"
        >
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Study Session"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) =>
                    setNewType(e.target.value as CalendarEvent["type"])
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="event">Event</option>
                  <option value="task">Task</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Optional description..."
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
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
