const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

// Dashboard
export const getDashboardSummary = () =>
  request<import("@/types").DashboardSummary>("/api/dashboard/summary");

export const getTodayFeed = () =>
  request<import("@/types").FeedItem[]>("/api/feed/today");

// Uploads
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const url = `${API_BASE}/api/uploads`;
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json() as Promise<import("@/types").UploadResponse>;
};

// Auth / Gmail
export const getGoogleLoginUrl = () =>
  request<{ url: string }>("/api/auth/google/login");

// Inbox
export const getGmailMessages = () =>
  request<import("@/types").GmailMessage[]>("/api/inbox/gmail/messages");

export const sendGmailReply = (payload: import("@/types").SendEmailPayload) =>
  request<{ success: boolean }>("/api/inbox/gmail/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const processInboxMessage = (content: string) =>
  request<{ summary: import("@/types").AISummary; draft: import("@/types").AIDraftReply }>(
    "/api/inbox/process",
    { method: "POST", body: JSON.stringify({ content }) }
  );

// Career
export const analyzeJob = (data: { url?: string; description?: string }) =>
  request<import("@/types").CareerSuggestion[]>("/api/career/analyze-job", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Calendar
export const extractSchedule = (content: string) =>
  request<import("@/types").CalendarEvent[]>("/api/calendar/extract-schedule", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

// Budget
export const getBudgetSummary = () =>
  request<import("@/types").BudgetSummary>("/api/budget/summary");

export const addBudgetEntry = (entry: Omit<import("@/types").BudgetEntry, "id">) =>
  request<import("@/types").BudgetEntry>("/api/budget/entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });

// Approvals
export const getPendingApprovals = () =>
  request<import("@/types").Approval[]>("/api/approvals/pending");

export const updateApproval = (id: string, status: "approved" | "rejected") =>
  request<import("@/types").Approval>(`/api/approvals/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
