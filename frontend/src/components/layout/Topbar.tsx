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
  InboxIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

const notifications = [
  { id: "1", text: "Prof. Martinez replied to your email", time: "30m ago", unread: true },
  { id: "2", text: "Google phone screen scheduled for Tuesday", time: "2h ago", unread: true },
  { id: "3", text: "Budget alert: Food spending above average", time: "5h ago", unread: false },
  { id: "4", text: "Scholarship deadline in 3 days", time: "1d ago", unread: false },
];

const searchablePages = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon, keywords: ["dashboard", "home", "overview"] },
  { label: "Inbox", href: "/inbox", icon: InboxIcon, keywords: ["inbox", "email", "messages", "mail", "reply"] },
  { label: "Career", href: "/career", icon: BriefcaseIcon, keywords: ["career", "jobs", "applications", "internship", "resume"] },
  { label: "Calendar", href: "/calendar", icon: CalendarDaysIcon, keywords: ["calendar", "schedule", "events", "meetings"] },
  { label: "Budget", href: "/budget", icon: BanknotesIcon, keywords: ["budget", "money", "expenses", "spending", "finance"] },
  { label: "My Profile", href: "/profile", icon: UserCircleIcon, keywords: ["profile", "account", "user", "me"] },
  { label: "Settings", href: "/settings", icon: Cog6ToothIcon, keywords: ["settings", "preferences", "config", "theme"] },
];

export default function Topbar() {
  const { theme, toggleTheme, user, logout, addToast } = useAppStore();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const initials = user?.initials || "V";
  const displayName = user?.name || "Vidhi";
  const displayEmail = user?.email || "vidhi@sparkup.ai";

  // Filter search results
  const searchResults = searchQuery.trim().length > 0
    ? searchablePages.filter((p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.keywords.some((k) => k.includes(searchQuery.toLowerCase()))
      )
    : [];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+K opens search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("sparkup-search")?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSearchSelect = (href: string) => {
    setSearchQuery("");
    setShowSearch(false);
    if (href === "/profile") {
      setShowProfileModal(true);
    } else if (href === "/settings") {
      setShowSettingsModal(true);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Search */}
          <div ref={searchRef} className="flex items-center gap-3 flex-1 max-w-md relative">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                id="sparkup-search"
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                placeholder="Search anything... (Ctrl+K)"
                suppressHydrationWarning
                className="w-full pl-10 pr-4 py-2 bg-background rounded-xl text-sm text-text-primary placeholder:text-text-secondary/60 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSearch && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50"
                >
                  {searchResults.length > 0 ? (
                    <div className="py-1">
                      <p className="px-4 py-2 text-xs text-text-secondary font-medium uppercase tracking-wider">Pages</p>
                      {searchResults.map((result) => (
                        <button
                          key={result.href}
                          onClick={() => handleSearchSelect(result.href)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          <result.icon className="w-4 h-4 text-text-secondary" />
                          <span>{result.label}</span>
                          <span className="ml-auto text-xs text-text-secondary/50">Go →</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-text-secondary">No results for &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
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
                className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
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
                          className={`px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer border-b border-border/30 last:border-0 ${notif.unread ? "bg-primary/5" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            {notif.unread && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
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
                className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center ml-2 cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all"
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
                      <button
                        onClick={() => { setShowProfile(false); setShowProfileModal(true); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        <UserCircleIcon className="w-4 h-4 text-text-secondary" />
                        My Profile
                      </button>
                      <button
                        onClick={() => { setShowProfile(false); setShowSettingsModal(true); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        <Cog6ToothIcon className="w-4 h-4 text-text-secondary" />
                        Settings
                      </button>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors cursor-pointer"
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

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowProfileModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-base font-semibold text-text-primary">My Profile</h2>
                  <button onClick={() => setShowProfileModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer text-text-secondary">✕</button>
                </div>
                <div className="px-6 py-6">
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center ring-4 ring-primary/20">
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-text-primary">{displayName}</h3>
                      <p className="text-sm text-text-secondary">{displayEmail}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-text-secondary">Role</span>
                      <span className="text-sm text-text-primary font-medium">Student</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-text-secondary">University</span>
                      <span className="text-sm text-text-primary font-medium">Arizona State University</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-text-secondary">Member Since</span>
                      <span className="text-sm text-text-primary font-medium">April 2026</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-text-secondary">Gmail</span>
                      <span className="text-xs px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowSettingsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-base font-semibold text-text-primary">Settings</h2>
                  <button onClick={() => setShowSettingsModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer text-text-secondary">✕</button>
                </div>
                <div className="px-6 py-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Theme</p>
                      <p className="text-xs text-text-secondary">Switch between light and dark mode</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover rounded-xl border border-border text-sm font-medium text-text-primary cursor-pointer hover:border-primary/30 transition-all"
                    >
                      {theme === "dark" ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                      {theme === "dark" ? "Dark" : "Light"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Notifications</p>
                      <p className="text-xs text-text-secondary">Receive push notifications</p>
                    </div>
                    <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">AI Auto-Draft</p>
                      <p className="text-xs text-text-secondary">Automatically draft email replies</p>
                    </div>
                    <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Timezone</p>
                      <p className="text-xs text-text-secondary">Used for greetings & scheduling</p>
                    </div>
                    <span className="text-sm text-text-secondary">MST (Arizona)</span>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <button
                      onClick={() => { handleLogout(); setShowSettingsModal(false); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-error bg-error/10 hover:bg-error/20 rounded-xl transition-colors cursor-pointer border border-error/20"
                    >
                      <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
