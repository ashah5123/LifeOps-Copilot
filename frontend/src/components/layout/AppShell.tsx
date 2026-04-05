"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AuthGuard from "./AuthGuard";
import { useAppStore } from "@/lib/store";
import AuroraBackground from "@/components/ui/AuroraBackground";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const initTheme = useAppStore((s) => s.initTheme);
  const initCalendarEvents = useAppStore((s) => s.initCalendarEvents);

  useEffect(() => {
    initTheme();
    initCalendarEvents();
  }, [initTheme, initCalendarEvents]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 md:ml-64">
          <Topbar />
          <AuroraBackground>
            <main className="relative px-4 md:px-8 py-6 pb-24 md:pb-6 min-h-[calc(100vh-60px)] bg-transparent dark:bg-gradient-subtle">
              {children}
            </main>
          </AuroraBackground>
        </div>
      </div>
    </AuthGuard>
  );
}
