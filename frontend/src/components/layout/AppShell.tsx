"use client";

<<<<<<< HEAD
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
=======
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AuthGuard from "./AuthGuard";
import ToastContainer from "@/components/ui/Toast";
import { motion } from "framer-motion";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="md:ml-64 flex flex-col min-h-screen">
          <Topbar />
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 p-4 md:p-6 pb-20 md:pb-6"
          >
            {children}
          </motion.main>
        </div>
        <ToastContainer />
      </div>
    </AuthGuard>
  );
}
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
