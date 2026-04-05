"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getGmailMessages, listCalendarEvents, getUpcomingDeadlines } from "@/lib/api";
import type { GmailMessage } from "@/types";

const searchablePages = [
  { label: "Dashboard", href: "/dashboard", keywords: ["home", "overview", "dashboard"] },
  { label: "Inbox", href: "/inbox", keywords: ["email", "gmail", "inbox", "messages"] },
  { label: "Career Tracker", href: "/career", keywords: ["career", "jobs", "applications", "resume", "internship"] },
  { label: "Calendar", href: "/calendar", keywords: ["calendar", "schedule", "events", "deadlines"] },
  { label: "Budget", href: "/budget", keywords: ["budget", "expense", "income", "money", "finance"] },
  { label: "My Profile", href: "/profile", keywords: ["profile", "account", "user"] },
  { label: "Settings", href: "/settings", keywords: ["settings", "preferences", "theme", "config"] },
];

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ms).toLocaleDateString();
}

export default function Topbar() {
  const { theme, toggleTheme, user, logout, notifications, markAllRead, isAuthenticated, setNotifications } =
    useAppStore();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const initials = user?.initials || "U";
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "user@sparkup.ai";

  const filteredPages = searchQuery.trim()
    ? searchablePages.filter(
        (p) =>
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.keywords.some((k) => k.includes(searchQuery.toLowerCase()))
      )
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    async function refreshLiveNotifications() {
      const next: { id: string; text: string; time: string; unread: boolean }[] = [];

      try {
        const raw = (await getGmailMessages()) as unknown as GmailMessage[] | Record<string, unknown>[];
        const msgs = Array.isArray(raw) ? raw : [];
        for (const m of msgs.slice(0, 6)) {
          const row = m as Record<string, unknown>;
          const id = String(row.id ?? "");
          const subj = String(row.subject ?? "Email");
          const snip = String(row.snippet ?? row.preview ?? "").slice(0, 120);
          const internal = row.internalDate != null ? Number(row.internalDate) : NaN;
          const t = Number.isFinite(internal) ? formatRelativeTime(internal) : "recent";
          const unread = row.isUnread === true || row.unread === true;
          next.push({
            id: `gmail-${id}`,
            text: snip ? `${subj}: ${snip}` : subj,
            time: t,
            unread,
          });
        }
      } catch {
        /* inbox optional */
      }

      try {
        const events = (await listCalendarEvents()) as Record<string, unknown>[];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const horizon = new Date(today);
        horizon.setDate(horizon.getDate() + 14);
        for (const ev of events) {
          const dateStr = String(ev.date ?? "").slice(0, 10);
          if (!dateStr) continue;
          const d = new Date(dateStr + "T12:00:00");
          if (d < today || d > horizon) continue;
          const title = String(ev.title ?? "Event");
          const time = String(ev.time ?? ev.start_time ?? "").slice(0, 5) || "—";
          next.push({
            id: `cal-${ev.id}`,
            text: `Calendar: ${title} on ${dateStr} at ${time}`,
            time: dateStr,
            unread: true,
          });
        }
      } catch {
        /* calendar optional */
      }

      try {
        const dl = (await getUpcomingDeadlines(14)) as {
          deadlines?: Record<string, unknown>[];
        };
        const list = dl?.deadlines ?? [];
        for (const d of list.slice(0, 4)) {
          const due = String(d.dueDate ?? d.due_date ?? "").slice(0, 10);
          next.push({
            id: `dl-${String(d.id ?? due + String(d.title ?? ""))}`,
            text: `Deadline: ${String(d.title ?? "Due soon")}${due ? ` (${due})` : ""}`,
            time: due || "upcoming",
            unread: true,
          });
        }
      } catch {
        /* deadlines optional */
      }

      if (!cancelled) {
        setNotifications(next.slice(0, 14));
      }
    }

    void refreshLiveNotifications();
    const interval = setInterval(refreshLiveNotifications, 120000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, setNotifications]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Search */}
        <div ref={searchRef} className="flex items-center gap-3 flex-1 max-w-md relative">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              suppressHydrationWarning
              className="w-full pl-10 pr-4 py-2 bg-background rounded-xl text-sm text-text-primary placeholder:text-text-secondary/60 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
          <AnimatePresence>
            {showSearch && filteredPages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-xl shadow-xl border border-border overflow-hidden z-50"
              >
                {filteredPages.map((p) => (
                  <button
                    key={p.href}
                    onClick={() => { router.push(p.href); setSearchQuery(""); setShowSearch(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <MoonIcon className="w-5 h-5 text-text-secondary" />
            ) : (
              <SunIcon className="w-5 h-5 text-text-secondary" />
            )}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <BellIcon className="w-5 h-5 text-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-text-secondary px-4 py-8 text-center">
                        No live alerts yet. Connect Gmail in Settings, or add calendar events and deadlines.
                      </p>
                    ) : null}
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-b border-border/30 last:border-0 ${
                          notif.unread ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {notif.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          )}
                          <div className={notif.unread ? "" : "ml-4"}>
                            <p className="text-sm text-text-primary">{notif.text}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-border">
                    <button
                      onClick={() => { markAllRead(); }}
                      className="text-xs font-medium text-primary hover:text-primary-hover cursor-pointer w-full text-center"
                    >
                      Mark all as read
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center ml-2 cursor-pointer"
            >
              <span className="text-sm font-semibold text-white">{initials}</span>
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50"
                >
                  <div className="px-4 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">{initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{displayName}</p>
                        <p className="text-xs text-text-secondary">{displayEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfile(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <UserCircleIcon className="w-4 h-4 text-text-secondary" />
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowProfile(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <Cog6ToothIcon className="w-4 h-4 text-text-secondary" />
                      Settings
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                      <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
