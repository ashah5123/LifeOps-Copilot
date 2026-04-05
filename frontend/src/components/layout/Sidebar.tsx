"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  HomeIcon,
  InboxIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  SparklesIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";
import SparklesEffect from "@/components/ui/SparklesEffect";
import {
  HomeIcon as HomeIconSolid,
  InboxIcon as InboxIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
} from "@heroicons/react/24/solid";

const navItems = [
  { href: "/know-us", label: "Know Us", shortLabel: "Know", icon: InformationCircleIcon, activeIcon: InformationCircleIconSolid },
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon, activeIcon: HomeIconSolid },
  { href: "/inbox", label: "Inbox", icon: InboxIcon, activeIcon: InboxIconSolid },
  { href: "/career", label: "Career", icon: BriefcaseIcon, activeIcon: BriefcaseIconSolid },
  { href: "/calendar", label: "Calendar", icon: CalendarDaysIcon, activeIcon: CalendarDaysIconSolid },
  { href: "/budget", label: "Budget", icon: BanknotesIcon, activeIcon: BanknotesIconSolid },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 border-r" style={{ background: "var(--sb)", borderColor: "var(--bd)" }}>
        {/* Logo with Sparkles */}
        <div className="relative flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "var(--bd)" }}>
          <div className="absolute inset-0 overflow-hidden">
            <SparklesEffect particleCount={15} particleColor="#5E6AD2" className="absolute inset-0" />
          </div>
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/20">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <span className="relative text-xl font-bold text-white tracking-tight">LifeOps</span>
        </div>

        {/* Navigation — micro-interactions (Dribbble-style hover lift + sweep) */}
        <nav className="flex-1 space-y-0.5 px-2.5 py-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/");
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link key={item.href} href={item.href} className="group block" aria-label={item.label}>
                <motion.div
                  whileHover={{ x: 4, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  className={`
                    relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-medium shadow-[0_6px_24px_-10px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors duration-200
                    ${isActive
                      ? "bg-white/12 text-white shadow-md shadow-primary/15 ring-1 ring-primary/30"
                      : "text-white/65 hover:border-white/18 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  <div
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
                    aria-hidden
                  >
                    <div className="absolute inset-y-0 left-0 w-[45%] -translate-x-full bg-gradient-to-r from-transparent via-white/18 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-sm shadow-primary/50"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <motion.div
                    className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25"
                    whileHover={{ scale: 1.08, y: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.div>
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-dot"
                      className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-sm shadow-primary/50"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User section (display only — no menu on click) */}
        <div className="border-t px-4 py-4" style={{ borderColor: "var(--bd)" }}>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-gradient-to-br from-primary/40 to-primary/20">
              <span className="text-xs font-semibold text-white">{user?.initials || "V"}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.firstName?.trim() || user?.name?.trim().split(/\s+/)[0] || "there"}
              </p>
              <p className="text-xs text-white/40">Student</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t z-40 px-1 py-2" style={{ borderColor: "var(--bd)" }}>
        <div className="flex items-center justify-around gap-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/");
            const Icon = isActive ? item.activeIcon : item.icon;
            const mobileLabel = item.shortLabel ?? item.label;

            return (
              <Link key={item.href} href={item.href} className="min-w-0 flex-1" aria-label={item.label}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors ${isActive ? "text-primary" : "text-white/50"
                  }`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-center text-[9px] font-medium leading-tight">{mobileLabel}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-active"
                      className="w-4 h-0.5 rounded-full bg-primary mt-0.5"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
