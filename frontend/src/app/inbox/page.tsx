"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import ConnectGmailButton from "@/components/inbox/ConnectGmailButton";
import { useAppStore } from "@/lib/store";
import { getGmailMessages, sendGmailReply, processInboxMessage, draftInboxReply } from "@/lib/api";
import { decodeHtmlEntities } from "@/lib/html";
import { mockGmailMessages } from "@/lib/mock-data";
import type { GmailMessage } from "@/types";

function splitSender(from: string): { display: string; email: string } {
  const bracket = from.match(/<([^>]+@[^>]+)>/);
  if (bracket) {
    const email = bracket[1].trim();
    const name = from.replace(bracket[0], "").replace(/"/g, "").trim();
    return { display: name || email.split("@")[0] || email, email };
  }
  if (from.includes("@")) return { display: from.split("@")[0], email: from.trim() };
  return { display: from || "Unknown", email: "unknown@local" };
}

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
        flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50
        ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-gray-50"}
      `}
    >
      <div className="flex-shrink-0 mt-0.5 w-2 flex justify-center" aria-hidden>
        {message.isUnread ? (
          <span className="block w-2 h-2 rounded-full bg-primary" title="Unread" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-sm truncate ${message.isUnread ? "font-semibold text-text-primary" : "font-medium text-text-secondary"}`}>
            {message.sender}
          </p>
          <span className="text-xs text-text-secondary whitespace-nowrap">{formatTime(message.timestamp)}</span>
        </div>
        <p className={`text-sm truncate ${message.isUnread ? "font-medium text-text-primary" : "text-text-secondary"}`}>
          {decodeHtmlEntities(message.subject)}
        </p>
        <p className="text-xs text-text-secondary truncate mt-0.5">
          {decodeHtmlEntities(message.preview)}
        </p>
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
  const [draft, setDraft] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const contentForAi = decodeHtmlEntities(
    message.body || message.preview || message.subject || "",
  );

  useEffect(() => {
    let cancelled = false;
    setAiSummary(null);
    setDraft("");
    const fallbackDraft = `Hi ${message.sender.split(" ")[0] || "there"},\n\nThanks for your message. I'll get back to you shortly.\n\nBest regards`;

    (async () => {
      try {
        const result = await processInboxMessage(contentForAi);
        if (cancelled) return;
        const extracted = result.extracted as Record<string, unknown> | undefined;
        const fields = extracted?.fields as Record<string, unknown> | undefined;
        const summaryText =
          (fields?.summary as string) ||
          `${message.sender} sent a message. Review and respond as needed.`;
        setAiSummary(decodeHtmlEntities(summaryText));
        const action = result.result as Record<string, unknown> | undefined;
        let nextDraft = (action?.draftReply as string | undefined)?.trim() || "";
        if (!nextDraft && contentForAi.trim()) {
          try {
            const dr = await draftInboxReply({ content: contentForAi });
            nextDraft = ((dr as { draft?: string }).draft || "").trim();
          } catch {
            /* use fallback */
          }
        }
        if (!cancelled) setDraft(nextDraft || fallbackDraft);
      } catch {
        if (!cancelled) {
          setAiSummary(`${message.sender} sent a message. Review and respond as needed.`);
          setDraft(fallbackDraft);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [message.id, contentForAi, message.sender]);

  const handleConfirmSend = async () => {
    setSending(true);
    try {
      await sendGmailReply({
        toEmail: message.senderEmail,
        subject: `Re: ${decodeHtmlEntities(message.subject)}`,
        body: draft,
        threadId: message.threadId || undefined,
        inReplyToMessageId: message.rfc822MessageId || undefined,
      });
      addToast({ message: "Email sent successfully!", type: "success" });
    } catch {
      addToast({ message: "Failed to send email", type: "error" });
    }
    setSending(false);
    setShowConfirmModal(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await draftInboxReply({
        content: `${contentForAi}\n\n(Regenerate a concise, professional reply.)`,
      });
      const d = (res as { draft?: string }).draft;
      if (d?.trim()) {
        setDraft(d.trim());
        addToast({ message: "Draft regenerated from AI pipeline", type: "info" });
      }
    } catch {
      addToast({ message: "Could not regenerate draft", type: "error" });
    }
    setRegenerating(false);
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
          <h2 className="text-lg font-semibold text-text-primary">
            {decodeHtmlEntities(message.subject)}
          </h2>
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
            {decodeHtmlEntities(message.body)}
          </div>
        </Card>

        {/* AI Summary */}
        <Card padding="md" className="mb-4 border-primary/20 bg-primary/5 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-primary uppercase tracking-wider">AI Summary</p>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">
            {aiSummary ? decodeHtmlEntities(aiSummary) : "Analyzing email..."}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleRegenerate()}
              loading={regenerating}
              icon={<ArrowPathIcon className="w-3.5 h-3.5" />}
            >
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

      {/* Confirm Send Modal — Human-in-the-loop */}
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
            <p className="text-sm font-medium text-text-primary">
              Re: {decodeHtmlEntities(message.subject)}
            </p>
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

export default function InboxPage() {
  const gmailConnected = useAppStore((s) => s.gmailConnected);
  const setGmailConnected = useAppStore((s) => s.setGmailConnected);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [messages, setMessages] = useState<GmailMessage[]>(mockGmailMessages);

  // Check for OAuth callback and load messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      setGmailConnected(true);
      window.history.replaceState({}, "", "/inbox");
    }
  }, [setGmailConnected]);

  // Fetch messages from backend when connected
  useEffect(() => {
    if (gmailConnected) {
      getGmailMessages()
        .then((backendMessages) => {
          // Backend returns { id, sender, subject, snippet } — map to frontend GmailMessage shape
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: GmailMessage[] = (backendMessages as unknown[]).map((raw) => {
            const m = raw as Record<string, unknown>;
            const from = String(m.sender || "Unknown");
            const { display, email } = splitSender(from);
            const unread =
              typeof m.isUnread === "boolean" ? m.isUnread : m.isUnread !== "false";
            return {
              id: String(m.id || `msg-${Math.random()}`),
              threadId: String(m.threadId || m.id || ""),
              sender: display,
              senderEmail: email,
              subject: String(m.subject || "(no subject)"),
              preview: String(m.snippet || m.preview || ""),
              body: String(m.body || m.snippet || m.preview || ""),
              timestamp: String(m.internalDate || m.timestamp || new Date().toISOString()),
              isUnread: Boolean(unread),
              labels: Array.isArray(m.labels) ? (m.labels as string[]) : [],
              rfc822MessageId: m.rfc822MessageId ? String(m.rfc822MessageId) : undefined,
            };
          });
          if (mapped.length > 0) setMessages(mapped);
        })
        .catch(() => {
          // Keep mock data on failure
        });
    }
  }, [gmailConnected]);

  return (
    <AppShell>
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
                        onClick={() => {
                          setSelectedMessage({ ...msg, isUnread: false });
                          setMessages((prev) =>
                            prev.map((m) => (m.id === msg.id ? { ...m, isUnread: false } : m)),
                          );
                        }}
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
