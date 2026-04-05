/**
 * API client — wraps every backend endpoint.
 *
 * Each method tries the real backend first and falls back to the
 * corresponding mock data when the server is unreachable.  This means
 * the frontend works identically whether or not the backend is running.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } catch {
    console.warn(`[api] GET ${path} failed – using mock fallback`);
    return fallback;
  }
}

async function post<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } catch {
    console.warn(`[api] POST ${path} failed – using mock fallback`);
    return fallback;
  }
}

async function patch<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } catch {
    console.warn(`[api] PATCH ${path} failed – using mock fallback`);
    return fallback;
  }
}

async function del(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
    return res.ok || res.status === 204;
  } catch {
    console.warn(`[api] DELETE ${path} failed`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function checkHealth(): Promise<{ status: string; service: string }> {
  return get("/health", { status: "offline", service: "SparkUp API" });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardSummary() {
  return get("/dashboard/summary", {
    todayTasks: 3,
    upcomingDeadlines: 2,
    pendingApprovals: 1,
    recentActivity: ["Uploaded syllabus", "Drafted email reply"],
  });
}

export async function getTodayFeed() {
  return get<{ id: string; type: string; title: string; time: string }[]>(
    "/dashboard/feed/today",
    [],
  );
}

// ---------------------------------------------------------------------------
// Inbox / Gmail
// ---------------------------------------------------------------------------

export async function listGmailMessages() {
  return get<{ id: string; sender: string; subject: string; snippet: string }[]>(
    "/inbox/gmail/messages",
    [],
  );
}

export async function sendGmailMessage(payload: {
  toEmail: string;
  subject: string;
  body: string;
}) {
  return post("/inbox/gmail/send", payload, {
    status: "sent (mock)",
    messageId: "mock-sent-001",
    to: payload.toEmail,
    subject: payload.subject,
  });
}

export async function draftReply(content: string) {
  return post("/inbox/draft-reply", { content }, {
    subject: "Re: Your request",
    draft: `Hello, here is a suggested reply based on: ${content.slice(0, 120)}`,
  });
}

export async function processInbox(content: string) {
  return post("/inbox/process", { content }, {});
}

// ---------------------------------------------------------------------------
// Auth / OAuth
// ---------------------------------------------------------------------------

export type GoogleLoginResponse = {
  authUrl: string;
  oauthConfigured: boolean;
};

/** OAuth URL from backend; when the server is down, treat as demo mode. */
export async function getGoogleLoginUrl(): Promise<GoogleLoginResponse> {
  try {
    const res = await fetch(`${BASE}/auth/google/login`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as GoogleLoginResponse;
  } catch {
    console.warn("[api] GET /auth/google/login failed – demo Gmail mode");
    return { authUrl: "", oauthConfigured: false };
  }
}

// ---------------------------------------------------------------------------
// Career
// ---------------------------------------------------------------------------

export async function listApplications() {
  return get<Record<string, unknown>[]>("/career/applications", []);
}

export async function createApplication(payload: {
  company: string;
  role: string;
  status?: string;
  applied_date?: string;
  job_url?: string;
  notes?: string;
}) {
  return post("/career/applications", payload, { id: `mock-${Date.now()}`, ...payload });
}

export async function updateApplication(id: string, payload: Record<string, unknown>) {
  return patch(`/career/applications/${id}`, payload, { id, ...payload });
}

export async function analyzeJob(payload: { jobDescription: string; resumeText?: string }) {
  return post("/career/analyze-job", payload, {
    jobTitle: "Software Engineer",
    company: "Unknown",
    requiredSkills: ["Python", "React", "SQL"],
    matchScore: 78,
    missingSkills: ["System Design", "Kubernetes"],
    fitSummary: "Candidate shows relevant experience.",
  });
}

export async function searchJobs(query: string, location = "") {
  return post("/career/jobs/search", { query, location }, { jobs: [], count: 0, query });
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

export async function listCalendarEvents() {
  return get<Record<string, unknown>[]>("/calendar/events", []);
}

export async function createCalendarEvent(payload: {
  title: string;
  date: string;
  time?: string;
  event_type?: string;
  location?: string;
  notes?: string;
  is_all_day?: boolean;
  course_name?: string;
}) {
  return post("/calendar/events", payload, { id: `mock-${Date.now()}`, ...payload });
}

export async function updateCalendarEvent(id: string, payload: Record<string, unknown>) {
  return patch(`/calendar/events/${id}`, payload, { id, ...payload });
}

export async function deleteCalendarEvent(id: string) {
  return del(`/calendar/events/${id}`);
}

export async function extractSchedule(content: string) {
  return post("/calendar/extract-schedule", { content }, {
    events: [],
    reminders: [],
    summary: content.slice(0, 180),
  });
}

// ---------------------------------------------------------------------------
// Calendar — Reminders
// ---------------------------------------------------------------------------

export async function listReminders() {
  return get<Record<string, unknown>[]>("/calendar/reminders", []);
}

export async function createReminder(payload: {
  title: string;
  dateTime: string;
  sourceModule?: string;
}) {
  return post("/calendar/reminders", payload, { id: `mock-${Date.now()}`, ...payload });
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export async function listBudgetEntries() {
  return get<Record<string, unknown>[]>("/budget/entries", []);
}

export async function createBudgetEntry(payload: {
  title: string;
  amount: number;
  entry_type: string;
  category: string;
  date?: string;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  notes?: string | null;
}) {
  return post("/budget/entries", payload, { id: `mock-${Date.now()}`, ...payload });
}

export async function updateBudgetEntry(id: string, payload: Record<string, unknown>) {
  return patch(`/budget/entries/${id}`, payload, { id, ...payload });
}

export async function getBudgetSummary() {
  return get<{ totalIncome: number; totalSpent: number; remainingBalance: number }>(
    "/budget/summary",
    { totalIncome: 0, totalSpent: 0, remainingBalance: 0 },
  );
}

export async function getBudgetHealth() {
  return get("/budget/health", { score: 0, grade: "N/A", advice: "" });
}

export async function getBudgetTrends(months = 6) {
  return get(`/budget/trends?months=${months}`, { periods: months, data: [] });
}

export async function getBudgetInsights() {
  return get("/budget/insights", { insights: [], recommendations: [] });
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export async function listPendingApprovals() {
  return get<Record<string, unknown>[]>("/approvals/pending", []);
}

export async function updateApproval(id: string, approved: boolean) {
  return patch(`/approvals/${id}`, { approved }, { id, approved });
}

// ---------------------------------------------------------------------------
// Uploads / Agent pipeline
// ---------------------------------------------------------------------------

export async function uploadFile(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE}/uploads`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    console.warn("[api] uploadFile failed – using mock fallback");
    return {
      uploadId: `mock-${Date.now()}`,
      fileName: file.name,
      fileUrl: "",
      status: "mock",
      extractedText: "",
    };
  }
}

export async function processFileWithAgents(file: File, domain?: string) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const url = new URL(`${BASE}/agents/process-file`);
    if (domain) url.searchParams.set("domain", domain);

    const res = await fetch(url.toString(), {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    console.warn("[api] processFileWithAgents failed – using mock fallback");
    return { upload: null, pipeline: {} };
  }
}
