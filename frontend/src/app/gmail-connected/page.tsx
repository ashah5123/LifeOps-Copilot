"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

/**
 * Public landing page after Google OAuth callback.
 * Sets gmailConnected, then sends authenticated users to Inbox and others to Login
 * (so AuthGuard does not block the flow).
 */
export default function GmailConnectedPage() {
  const router = useRouter();

  useEffect(() => {
    useAppStore.getState().setGmailConnected(true);
    const authed = useAppStore.getState().isAuthenticated;
    if (authed) {
      router.replace("/inbox");
    } else {
      router.replace("/login?gmail=connected");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-background px-4">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-secondary text-center">Finishing Gmail connection…</p>
    </div>
  );
}
