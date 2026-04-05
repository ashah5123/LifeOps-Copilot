"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import * as api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import ConnectGmailButton from "@/components/inbox/ConnectGmailButton";
import { useAppStore } from "@/lib/store";
import { mockGmailMessages } from "@/lib/mock-data";
import { mapGmailApiRowsToMessages } from "@/lib/map-inbox";
import type { GmailMessage } from "@/types";

function formatTime(timestamp: string) {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function EmailListItem({
  message,
  isSelected,
  onClick,
}: {
  message: GmailMessage;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`
        flex items-start gap-3 border-b border-border/50 p-4 transition-colors
        ${isSelected
          ? "border-l-2 border-l-primary bg-primary/[0.12] dark:bg-primary/25 dark:shadow-[inset_0_0_0_1px_rgba(94,106,210,0.25)]"
          : "hover:bg-zinc-100/90 dark:hover:bg-white/[0.06]"
        }
        cursor-pointer
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {message.isUnread && (
          <span className="block w-2 h-2 rounded-full bg-primary" />
        )}
        {!message.isUnread && <span className="block w-2 h-2" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-sm truncate ${message.isUnread || isSelected ? "font-semibold text-text-primary" : "font-medium text-text-secondary"}`}>
            {message.sender}
          </p>
          <span className={`text-xs whitespace-nowrap ${isSelected ? "text-text-secondary" : "text-text-secondary"}`}>{formatTime(message.timestamp)}</span>
        </div>
        <p className={`text-sm truncate ${message.isUnread || isSelected ? "font-medium text-text-primary" : "text-text-secondary"}`}>
          {message.subject}
        </p>
        <p className={`mt-0.5 truncate text-xs ${isSelected ? "text-text-secondary" : "text-text-secondary/90"}`}>{message.preview}</p>
      </div>
    </motion.div>
  );
}

function EmailDetailPanel({
  message,
  onBack,
}: {
  message: GmailMessage;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(
    `Dear ${message.sender.split(" ")[0]},\n\nThank you for your email. I've reviewed the details and would like to follow up on the points you've raised.\n\nBest regards,\nVidhi`
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  const handleConfirmSend = async () => {
    setSending(true);
    try {
      await api.sendGmailMessage({
        toEmail: message.senderEmail,
        subject: `Re: ${message.subject}`,
        body: draft,
      });
      addToast({ message: "Email sent successfully!", type: "success" });
    } catch {
      addToast({ message: "Failed to send email", type: "error" });
    } finally {
      setSending(false);
      setShowConfirmModal(false);
    }
  };

  const handleRegenerate = async () => {
    const result = await api.draftReply(message.body);
    setDraft(result.draft);
    addToast({ message: "Draft regenerated", type: "info" });
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Mobile back button */}
        <div className="md:hidden mb-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary cursor-pointer">
            <ArrowLeftIcon className="w-4 h-4" /> Back to inbox
          </button>
        </div>

        {/* Email Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{message.subject}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-text-secondary">
              From: <span className="font-medium text-text-primary">{message.sender}</span>
            </p>
            <span className="text-xs text-text-secondary">&lt;{message.senderEmail}&gt;</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">{formatTime(message.timestamp)}</p>
        </div>

        {/* Original Email */}
        <Card padding="md" className="mb-4 flex-shrink-0">
          <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">Original Email</p>
          <div className="text-sm text-text-primary whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
            {message.body}
          </div>
        </Card>

        {/* AI Summary */}
        <Card padding="md" className="mb-4 border-primary/20 bg-primary/5 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-primary uppercase tracking-wider">AI Summary</p>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">
            {message.sender} is requesting feedback on specific items. Key action: respond with your revised approach by the mentioned deadline.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="info">Requires Response</Badge>
            <Badge variant="warning">Has Deadline</Badge>
          </div>
        </Card>

        {/* AI Draft Reply */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium text-primary uppercase tracking-wider">AI Draft Reply</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRegenerate} icon={<ArrowPathIcon className="w-3.5 h-3.5" />}>
              Regenerate
            </Button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 min-h-[120px] w-full p-4 bg-surface border border-border rounded-xl text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
          <div className="flex items-center gap-3 mt-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowConfirmModal(true)}
              icon={<PaperAirplaneIcon className="w-4 h-4" />}
              className="flex-1 md:flex-none"
            >
              Confirm Send
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Send Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="You are about to send this email"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">To:</p>
            <p className="text-sm font-medium text-text-primary">{message.sender} &lt;{message.senderEmail}&gt;</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Subject:</p>
            <p className="text-sm font-medium text-text-primary">Re: {message.subject}</p>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border/50">
            <p className="text-xs text-text-secondary mb-2">Preview:</p>
            <p className="text-sm text-text-primary whitespace-pre-wrap">{draft}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="accent" onClick={handleConfirmSend} loading={sending} className="flex-1">
              Confirm Send
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Handles ?gmail=connected query param from OAuth callback */
function GmailCallbackHandler() {
  const searchParams = useSearchParams();
  const gmailConnected = useAppStore((s) => s.gmailConnected);
  const setGmailConnected = useAppStore((s) => s.setGmailConnected);

  useEffect(() => {
    if (searchParams.get("gmail") === "connected" && !gmailConnected) {
      setGmailConnected(true);
    }
  }, [searchParams, gmailConnected, setGmailConnected]);

  return null;
}

export default function InboxPage() {
  const gmailConnected = useAppStore((s) => s.gmailConnected);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [messages, setMessages] = useState<GmailMessage[]>(mockGmailMessages);

  useEffect(() => {
    if (!gmailConnected) return;
    let cancelled = false;
    (async () => {
      const raw = await api.listGmailMessages();
      if (cancelled) return;
      const mapped = mapGmailApiRowsToMessages(raw as unknown[]);
      setMessages(mapped.length > 0 ? mapped : mockGmailMessages);
    })();
    return () => {
      cancelled = true;
    };
  }, [gmailConnected]);

  return (
    <AppShell>
      {/* Handle OAuth callback ?gmail=connected */}
      <Suspense fallback={null}>
        <GmailCallbackHandler />
      </Suspense>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Inbox</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {gmailConnected ? `${messages.length} messages` : "Connect your Gmail to get started"}
            </p>
          </div>
          {gmailConnected && (
            <Badge variant="success">Gmail Connected</Badge>
          )}
        </div>

        {!gmailConnected ? (
          <Card>
            <ConnectGmailButton />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
            {/* Email List */}
            <AnimatePresence mode="wait">
              {
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`md:col-span-2 bg-surface rounded-2xl border border-border/50 overflow-hidden ${selectedMessage ? "hidden md:block" : ""}`}
                >
                  <div className="overflow-y-auto h-full">
                    {messages.map((msg) => (
                      <EmailListItem
                        key={msg.id}
                        message={msg}
                        isSelected={selectedMessage?.id === msg.id}
                        onClick={() => setSelectedMessage(msg)}
                      />
                    ))}
                  </div>
                </motion.div>
              }
            </AnimatePresence>

            {/* Detail Panel */}
            <div className={`md:col-span-3 bg-surface rounded-2xl border border-border/50 p-5 overflow-y-auto ${!selectedMessage ? "hidden md:flex md:items-center md:justify-center" : ""}`}>
              {selectedMessage ? (
                <EmailDetailPanel message={selectedMessage} onBack={() => setSelectedMessage(null)} />
              ) : (
                <div className="text-center py-16">
                  <p className="text-sm text-text-secondary">Select an email to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
