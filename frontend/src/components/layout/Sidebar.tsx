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
} from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";
import {
  HomeIcon as HomeIconSolid,
  InboxIcon as InboxIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  BanknotesIcon as BanknotesIconSolid,
} from "@heroicons/react/24/solid";

const navItems = [
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
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "var(--bd)" }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/20">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">SparkUp</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/");
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                  className={`
                    relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200
                    ${isActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/8 hover:text-white"
                    }
                  `}
                >
                  {/* Active left accent bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full shadow-sm shadow-primary/50"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    />
                  )}
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "var(--bd)" }}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">{user?.initials || "V"}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name || "Vidhi"}</p>
              <p className="text-xs text-white/40">Student</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t z-40 px-2 py-2" style={{ borderColor: "var(--bd)" }}>
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/");
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? "text-primary" : "text-white/50"
                }`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
