"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import { getGoogleLoginUrl } from "@/lib/api";

export default function ConnectGmailButton() {
  const [loading, setLoading] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const data = await getGoogleLoginUrl("/inbox");
      // Redirect user to Google OAuth consent screen
      window.location.href = data.authUrl;
    } catch {
      addToast({ message: "Failed to get login URL. Is the backend running?", type: "error" });
      setLoading(false);
    }
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
      <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 bg-amber-500/15 text-amber-900 dark:text-amber-100 border border-amber-500/35 rounded-xl text-xs font-medium mb-8 max-w-lg text-center sm:text-left">
        <span className="inline-flex items-center justify-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Google OAuth in Testing?
        </span>
        <span className="text-[11px] font-normal opacity-90">
          If you see <strong className="font-semibold">403: access_denied</strong>, add your Gmail under{" "}
          <em>OAuth consent screen → Test users</em> in Google Cloud Console. For production, use your Cloud Run
          API URL in <em>Authorized redirect URIs</em>.
        </span>
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
