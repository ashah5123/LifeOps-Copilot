"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AuthGuard from "./AuthGuard";
import { useAppStore } from "@/lib/store";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const initTheme = useAppStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 md:ml-64">
          <Topbar />
          <main className="px-4 md:px-8 py-6 pb-24 md:pb-6 bg-gradient-subtle min-h-[calc(100vh-60px)]">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
