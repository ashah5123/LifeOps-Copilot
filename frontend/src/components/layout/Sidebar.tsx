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
      <aside className="hidden md:flex flex-col w-64 bg-sidebar h-screen fixed left-0 top-0 z-40">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LifeOps Copilot</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.15 }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200
                    ${isActive
                      ? "bg-sidebar-active/20 text-white"
                      : "text-gray-400 hover:bg-sidebar-hover hover:text-white"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{user?.initials || "V"}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name || "Vidhi"}</p>
              <p className="text-xs text-gray-400">Student</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg ${
                  isActive ? "text-primary" : "text-text-secondary"
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
