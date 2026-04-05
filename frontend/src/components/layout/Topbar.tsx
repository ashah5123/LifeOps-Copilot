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

const notifications = [
  { id: "1", text: "Prof. Martinez replied to your email", time: "30m ago", unread: true },
  { id: "2", text: "Google phone screen scheduled for Tuesday", time: "2h ago", unread: true },
  { id: "3", text: "Budget alert: Food spending above average", time: "5h ago", unread: false },
  { id: "4", text: "Scholarship deadline in 3 days", time: "1d ago", unread: false },
];

export default function Topbar() {
  const { theme, toggleTheme, user, logout } = useAppStore();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const initials = user?.initials || "V";
  const displayName = user?.name || "Vidhi";
  const displayEmail = user?.email || "vidhi@lifeops.ai";

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search anything..."
              suppressHydrationWarning
              className="w-full pl-10 pr-4 py-2 bg-background rounded-xl text-sm text-text-primary placeholder:text-text-secondary/60 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
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
                    <button className="text-xs font-medium text-primary hover:text-primary-hover cursor-pointer w-full text-center">
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
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <UserCircleIcon className="w-4 h-4 text-text-secondary" />
                      My Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <Cog6ToothIcon className="w-4 h-4 text-text-secondary" />
                      Settings
                    </button>
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
