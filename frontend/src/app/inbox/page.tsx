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
import {
  getGmailConnectionStatus,
  getGmailMessages,
  getGmailMessageDetail,
  sendGmailReply,
  processInboxMessage,
  draftInboxReply,
  getGoogleLoginUrl,
} from "@/lib/api";
import { htmlToPlainText } from "@/lib/html";
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

function internalDateToIso(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return new Date().toISOString();
  return new Date(n).toISOString();
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
        ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-surface-hover dark:hover:bg-white/[0.06]"}
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
          {htmlToPlainText(message.subject)}
        </p>
        <p className="text-xs text-text-secondary truncate mt-0.5">
          {htmlToPlainText(message.preview)}
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

  const contentForAi = htmlToPlainText(
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
        setAiSummary(htmlToPlainText(summaryText));
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
        subject: `Re: ${htmlToPlainText(message.subject)}`,
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
            {htmlToPlainText(message.subject)}
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
            {htmlToPlainText(message.body)}
          </div>
        </Card>

        {/* AI Summary */}
        <Card padding="md" className="mb-4 border-primary/20 bg-primary/5 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-primary uppercase tracking-wider">AI Summary</p>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">
            {aiSummary ? htmlToPlainText(aiSummary) : "Analyzing email..."}
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
              Re: {htmlToPlainText(message.subject)}
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
  const addToast = useAppStore((s) => s.addToast);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);

  // Strip legacy query param; real state comes from the server
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      window.history.replaceState({}, "", "/inbox");
    }
  }, []);

  // Always sync Gmail connection from API (never trust stale localStorage alone)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatusLoading(true);
      try {
        const s = await getGmailConnectionStatus();
        if (cancelled) return;
        setGmailConnected(Boolean(s.connected));
        setOauthConfigured(Boolean(s.oauthConfigured));
      } catch {
        if (!cancelled) {
          setGmailConnected(false);
          setOauthConfigured(true);
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setGmailConnected, refreshKey]);

  const openGoogleOauth = async () => {
    setReconnecting(true);
    try {
      const { authUrl } = await getGoogleLoginUrl("/inbox");
      if (!authUrl?.startsWith("http")) throw new Error("Invalid auth URL");
      window.location.assign(authUrl);
    } catch {
      addToast({ message: "Could not start Google sign-in. Is the API running?", type: "error" });
      setReconnecting(false);
    }
  };

  // Fetch live messages only when the server reports a real Gmail token
  useEffect(() => {
    if (statusLoading) return;
    if (!gmailConnected) {
      setMessages([]);
      setInboxLoading(false);
      setSelectedMessage(null);
      return;
    }
    setInboxLoading(true);
    setMessages([]);
    getGmailMessages()
      .then((backendMessages) => {
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
            timestamp: m.internalDate
              ? internalDateToIso(String(m.internalDate))
              : String(m.timestamp || new Date().toISOString()),
            isUnread: Boolean(unread),
            labels: Array.isArray(m.labels) ? (m.labels as string[]) : [],
            rfc822MessageId: m.rfc822MessageId ? String(m.rfc822MessageId) : undefined,
          };
        });
        setMessages(mapped);
      })
      .catch((err) => {
        setMessages([]);
        const detail = err instanceof Error ? err.message : "Could not load Gmail.";
        addToast({ message: detail, type: "error" });
      })
      .finally(() => setInboxLoading(false));
  }, [gmailConnected, statusLoading, addToast]);

  // Load full MIME-decoded body when a message is selected (live Gmail only).
  useEffect(() => {
    if (!gmailConnected || !selectedMessage) return;
    const id = selectedMessage.id;
    let cancelled = false;
    void getGmailMessageDetail(id)
      .then((d) => {
        if (cancelled) return;
        const fromApiBody = typeof d.body === "string" ? d.body : undefined;
        const ts =
          typeof d.internalDate === "string" ? internalDateToIso(d.internalDate) : undefined;
        const rfc = d.rfc822MessageId != null ? String(d.rfc822MessageId) : undefined;
        const tid = d.threadId != null ? String(d.threadId) : undefined;
        setSelectedMessage((prev) => {
          if (prev?.id !== id) return prev;
          return {
            ...prev,
            body: fromApiBody ?? prev.body,
            timestamp: ts ?? prev.timestamp,
            rfc822MessageId: rfc ?? prev.rfc822MessageId,
            threadId: tid ?? prev.threadId,
          };
        });
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            return {
              ...m,
              body: fromApiBody ?? m.body,
              timestamp: ts ?? m.timestamp,
              rfc822MessageId: rfc ?? m.rfc822MessageId,
              threadId: tid ?? m.threadId,
            };
          }),
        );
      })
      .catch(() => {
        /* keep list/snippet as body */
      });
    return () => {
      cancelled = true;
    };
  }, [gmailConnected, selectedMessage?.id]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Inbox</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {statusLoading
                ? "Checking Gmail connection…"
                : gmailConnected
                  ? inboxLoading
                    ? "Loading messages…"
                    : `${messages.length} message${messages.length === 1 ? "" : "s"}`
                  : "Connect Gmail on this device to load your real inbox (no demo mail)."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {gmailConnected && !statusLoading ? (
              <>
                <Badge variant="success">Gmail Connected</Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowPathIcon className="w-4 h-4" />}
                  onClick={() => setRefreshKey((k) => k + 1)}
                  disabled={statusLoading || inboxLoading}
                >
                  Refresh
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void openGoogleOauth()} loading={reconnecting}>
                  Reconnect Gmail
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {statusLoading ? (
          <Card padding="md">
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-9 w-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Checking connection…</p>
            </div>
          </Card>
        ) : !gmailConnected ? (
          <div className="space-y-4">
            {!oauthConfigured ? (
              <Card padding="md" className="border-amber-500/30 bg-amber-500/5">
                <p className="text-sm font-medium text-text-primary">Google OAuth is not configured on the server</p>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  Set <code className="text-[11px] bg-surface px-1 rounded">GOOGLE_CLIENT_ID</code>,{" "}
                  <code className="text-[11px] bg-surface px-1 rounded">GOOGLE_CLIENT_SECRET</code>, and{" "}
                  <code className="text-[11px] bg-surface px-1 rounded">GOOGLE_REDIRECT_URI</code> in{" "}
                  <code className="text-[11px] bg-surface px-1 rounded">backend/.env</code>, restart the API, and try
                  again.
                </p>
              </Card>
            ) : null}
            <Card>
              <ConnectGmailButton />
            </Card>
            <p className="text-xs text-text-secondary text-center max-w-lg mx-auto">
              Signed in with email/password? Use <strong>Connect Gmail</strong> here to authorize the same Google
              account. LifeOps stores tokens on the server and only reads/sends mail after you confirm.
            </p>
          </div>
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
                    {inboxLoading ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
                        <div className="h-9 w-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-text-secondary">Loading mail…</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="py-16 px-4 text-center text-sm text-text-secondary">
                        No messages in this mailbox yet.
                      </div>
                    ) : null}
                    {!inboxLoading &&
                      messages.map((msg) => (
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
