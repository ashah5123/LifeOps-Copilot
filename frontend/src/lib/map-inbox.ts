import type { GmailMessage } from "@/types";

/** Map backend Gmail list rows (minimal fields) to full GmailMessage for the inbox UI. */
export function mapGmailApiRowsToMessages(rows: unknown[]): GmailMessage[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows.map((row, index) => {
    const r = row as Record<string, string | undefined>;
    const id = String(r.id ?? `msg-${index}`);
    const rawSender = String(r.sender ?? "Unknown");
    let senderName = rawSender;
    let senderEmail = rawSender;

    if (rawSender.includes("@") && !rawSender.includes(" ")) {
      senderEmail = rawSender;
      const local = rawSender.split("@")[0] ?? "user";
      senderName = local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (rawSender.includes("<") && rawSender.includes(">")) {
      const m = rawSender.match(/^(.+?)\s*<([^>]+)>$/);
      if (m) {
        senderName = m[1].trim();
        senderEmail = m[2].trim();
      }
    }

    const snippet = String(r.snippet ?? r.preview ?? "");
    const subject = String(r.subject ?? "(no subject)");
    const body = String(r.body ?? snippet ?? "—");

    return {
      id,
      threadId: String(r.threadId ?? id),
      sender: senderName,
      senderEmail: senderEmail.includes("@") ? senderEmail : `${senderEmail}@example.local`,
      subject,
      preview: snippet,
      body,
      timestamp: String(r.timestamp ?? new Date().toISOString()),
      isUnread: r.isUnread !== "false" && r.read !== "true",
      labels: [],
    };
  });
}
