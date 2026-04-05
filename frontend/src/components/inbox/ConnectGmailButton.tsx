"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";

export default function ConnectGmailButton() {
  const [loading, setLoading] = useState(false);
  const setGmailConnected = useAppStore((s) => s.setGmailConnected);
  const addToast = useAppStore((s) => s.addToast);

  const handleConnect = async () => {
    setLoading(true);
    // Simulate OAuth flow
    await new Promise((r) => setTimeout(r, 2000));
    setGmailConnected(true);
    addToast({ message: "Gmail connected successfully!", type: "success" });
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#4DA3FF"/>
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Your Gmail</h2>
      <p className="text-sm text-text-secondary text-center max-w-md mb-2">
        Link your Gmail account to let LifeOps read your emails, generate AI summaries, and help you draft replies.
      </p>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Testing Mode — Demo Accounts Only
      </div>

      <Button size="lg" onClick={handleConnect} loading={loading}>
        Connect Gmail
      </Button>

      <p className="text-xs text-text-secondary mt-4 text-center max-w-sm">
        LifeOps will never send emails without your explicit confirmation.
        Your data stays private and secure.
      </p>
    </motion.div>
  );
}
