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
  request<import("@/types").FeedItem[]>("/api/dashboard/feed/today");

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
  request<{ authUrl: string }>("/api/auth/google/login");

// Inbox
export const getGmailMessages = () =>
  request<import("@/types").GmailMessage[]>("/api/inbox/gmail/messages");

export const sendGmailReply = (payload: {
  toEmail: string;
  subject: string;
  body: string;
}) =>
  request<{ status: string; messageId: string; to: string }>(
    "/api/inbox/gmail/send",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

export const processInboxMessage = (content: string) =>
  request<Record<string, unknown>>("/api/inbox/process", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

// Career
export const analyzeJob = (payload: {
  jobDescription: string;
  resumeText?: string;
}) =>
  request<Record<string, unknown>>("/api/career/analyze-job", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const tailorResume = (payload: {
  jobDescription: string;
  resumeText: string;
}) =>
  request<Record<string, unknown>>("/api/career/tailor-resume", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Calendar
export const extractSchedule = (content: string) =>
  request<Record<string, unknown>>("/api/calendar/extract-schedule", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const createReminders = (content: string) =>
  request<Record<string, unknown>>("/api/calendar/reminders", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

// Budget
export const getBudgetSummary = () =>
  request<import("@/types").BudgetSummary>("/api/budget/summary");

export const addBudgetEntry = (entry: {
  title: string;
  amount: number;
  entryType: string;
}) =>
  request<Record<string, unknown>>("/api/budget/entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });

// Approvals
export const getPendingApprovals = () =>
  request<import("@/types").Approval[]>("/api/approvals/pending");

export const updateApproval = (id: string, approved: boolean) =>
  request<Record<string, unknown>>(`/api/approvals/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ approved }),
  });
