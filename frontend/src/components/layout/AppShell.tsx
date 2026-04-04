"use client";

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