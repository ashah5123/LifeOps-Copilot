/**
 * LifeOps Copilot — API client for the FastAPI backend.
 * Base URL: NEXT_PUBLIC_API_URL or http://localhost:8000
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export { API_BASE };

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  try {
    const raw =
      localStorage.getItem("lifeops-state") || localStorage.getItem("sparkup-state");
    if (!raw) return {};
    const tok = (JSON.parse(raw) as { authToken?: string | null }).authToken;
    if (tok) return { Authorization: `Bearer ${tok}` };
  } catch {
    /* ignore */
  }
  return {};
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = (error as { detail?: string | unknown }).detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? (detail as { msg?: string }[]).map((e) => e.msg || JSON.stringify(e)).join("; ")
          : `API Error: ${res.status}`;
    throw new Error(msg);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function fetchBlob(endpoint: string): Promise<Blob> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Download failed: ${res.status}`);
  }
  return res.blob();
}

async function uploadForm(endpoint: string, file: File, fieldName = "file"): Promise<unknown> {
  const formData = new FormData();
  formData.append(fieldName, file);
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((error as { detail?: string }).detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

// --- Health ---
export const getHealth = () => request<Record<string, unknown>>("/api/health");

// --- Dashboard ---
export const getDashboardSummary = () =>
  request<import("@/types").DashboardSummary>("/api/dashboard/summary");

export const getTodayFeed = () =>
  request<import("@/types").FeedItem[]>("/api/dashboard/feed/today");

// --- Uploads ---
export const uploadFile = (file: File) => uploadForm("/api/uploads", file);

// --- Auth / Gmail ---
export const getGoogleLoginUrl = () =>
  request<{ authUrl: string }>("/api/auth/google/login");

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authRegister = (body: { email: string; password: string; name?: string }) =>
  request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const authLogin = (body: { email: string; password: string }) =>
  request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const authMe = () => request<AuthUser>("/api/auth/me");

export const authForgotPassword = (email: string) =>
  request<{ message: string; token: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const authResetPassword = (body: { email: string; token: string; new_password: string }) =>
  request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });

// --- Inbox ---
export const getGmailConnectionStatus = () =>
  request<{ connected: boolean; oauthConfigured: boolean }>("/api/inbox/gmail/status");

export const getGmailMessages = () =>
  request<import("@/types").GmailMessage[]>("/api/inbox/gmail/messages");

export const getGmailMessageDetail = (messageId: string) =>
  request<Record<string, unknown>>(`/api/inbox/gmail/messages/${encodeURIComponent(messageId)}`);

export const sendGmailReply = (payload: {
  toEmail: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyToMessageId?: string;
}) =>
  request<{ status: string; messageId: string; to: string }>("/api/inbox/gmail/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const processInboxMessage = (content: string) =>
  request<Record<string, unknown>>("/api/inbox/process", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const draftInboxReply = (payload: Record<string, unknown>) =>
  request<Record<string, unknown>>("/api/inbox/draft-reply", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getInboxActions = () =>
  request<Record<string, unknown>[]>("/api/inbox/actions");

// --- Career: analysis ---
export const analyzeJob = (payload: { jobDescription: string; resumeText?: string }) =>
  request<Record<string, unknown>>("/api/career/analyze-job", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const tailorResume = (payload: { jobDescription: string; resumeText: string }) =>
  request<Record<string, unknown>>("/api/career/tailor-resume", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const generateCoverLetter = (payload: { jobDescription: string; resumeText?: string }) =>
  request<{ coverLetter: string }>("/api/career/generate-cover-letter", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// --- Career: applications ---
export const createApplication = (payload: Record<string, unknown>) =>
  request<Record<string, unknown>>("/api/career/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listApplications = () =>
  request<Record<string, unknown>[]>("/api/career/applications");

export const getApplication = (id: string) =>
  request<Record<string, unknown>>(`/api/career/applications/${encodeURIComponent(id)}`);

export const patchApplication = (id: string, payload: Record<string, unknown>) =>
  request<Record<string, unknown>>(`/api/career/applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const getCareerPipeline = () => request<Record<string, unknown>>("/api/career/pipeline");

export const getUpcomingInterviews = () =>
  request<Record<string, unknown>[]>("/api/career/interviews/upcoming");

export const getCareerFollowUps = () =>
  request<Record<string, unknown>[]>("/api/career/follow-ups");

export const getCareerMetrics = () => request<Record<string, unknown>>("/api/career/metrics");

export const getApplicationNextAction = (applicationId: string) =>
  request<Record<string, unknown>>(
    `/api/career/applications/${encodeURIComponent(applicationId)}/next-action`
  );

// --- Career: interview prep ---
export const interviewPrepQuestions = (payload: { jobDescription: string; role: string }) =>
  request<unknown[]>("/api/career/interview-prep/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const interviewPrepStarStories = (payload: { resumeText: string }) =>
  request<unknown[]>("/api/career/interview-prep/star-stories", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const interviewPrepCompanyResearch = (payload: { companyName: string }) =>
  request<Record<string, unknown>>("/api/career/interview-prep/company-research", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const interviewPrepQuestionsToAsk = (payload: { companyName: string; role: string }) =>
  request<unknown[]>("/api/career/interview-prep/questions-to-ask", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const interviewPrepChecklist = (payload: { interviewType: string }) =>
  request<unknown[]>("/api/career/interview-prep/checklist", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// --- Career: skills ---
export const skillsGapAnalysis = (payload: { resumeText: string; jobDescription: string }) =>
  request<Record<string, unknown>>("/api/career/skills/gap-analysis", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const skillsImprovements = (userId = "demo-user") =>
  request<Record<string, unknown>>(
    `/api/career/skills/improvements?user_id=${encodeURIComponent(userId)}`
  );

export const skillsCertifications = (payload: { targetRole: string }) =>
  request<unknown[]>("/api/career/skills/certifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const skillsLearningPlan = (payload: { missingSkills: string[] }) =>
  request<Record<string, unknown>>("/api/career/skills/learning-plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// --- Career: job board (JSearch + legacy) ---
export const searchJobsJSearch = (payload: {
  query: string;
  location?: string;
  num_pages?: number;
  filters?: Record<string, unknown>;
}) =>
  request<{ jobs: Record<string, unknown>[]; count: number; query: string }>(
    "/api/career/jobs/search",
    {
      method: "POST",
      body: JSON.stringify({
        query: payload.query,
        location: payload.location ?? "",
        num_pages: payload.num_pages ?? 1,
        filters: payload.filters ?? {},
      }),
    }
  );

export const getSavedJobs = () => request<Record<string, unknown>[]>("/api/career/jobs/saved");

export const getTrendingJobs = () =>
  request<{ jobs: Record<string, unknown>[]; count: number }>("/api/career/jobs/trending");

export const recommendJobs = (payload: Record<string, unknown>) =>
  request<{ jobs: Record<string, unknown>[]; count: number }>("/api/career/jobs/recommend", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getJobDetails = (jobId: string) =>
  request<Record<string, unknown>>(`/api/career/jobs/${encodeURIComponent(jobId)}`);

export const saveJob = (jobId: string) =>
  request<Record<string, unknown>>(`/api/career/jobs/${encodeURIComponent(jobId)}/save`, {
    method: "POST",
  });

export const unsaveJob = (jobId: string) =>
  request<void>(`/api/career/jobs/${encodeURIComponent(jobId)}/unsave`, {
    method: "DELETE",
  });

export const applyFromJobListing = (jobId: string, payload?: Record<string, unknown>) =>
  request<Record<string, unknown>>(
    `/api/career/jobs/${encodeURIComponent(jobId)}/apply`,
    {
      method: "POST",
      body: JSON.stringify(payload ?? { resume_text: "", cover_letter: "", notes: "" }),
    }
  );

/** ATS-focused resume rewrite for a specific job (Vertex/Gemini when configured). */
export const optimizeResumeForAts = (body: {
  job_description: string;
  resume_text: string;
  company?: string;
  role?: string;
}) =>
  request<{
    optimized_resume_text: string;
    estimated_ats_match_percent: number;
    change_summary: string;
    keywords_added: string[];
    transparency_steps: string[];
  }>("/api/career/ats-optimize-resume", {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Free API job search (no RapidAPI). */
export const searchJobsFree = (query: string) =>
  request<Record<string, unknown>[]>(
    `/api/career/search-jobs?q=${encodeURIComponent(query)}`
  );

/**
 * Prefer JSearch when configured; fall back to free search-jobs endpoint.
 */
export async function searchJobs(query: string): Promise<Record<string, unknown>[]> {
  try {
    const data = await searchJobsJSearch({ query, num_pages: 1 });
    if (data.jobs?.length) return data.jobs;
  } catch {
    /* RapidAPI missing or error */
  }
  return searchJobsFree(query);
}

// --- Calendar: extract & reminders ---
export const extractSchedule = (content: string) =>
  request<Record<string, unknown>>("/api/calendar/extract-schedule", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const createRemindersFromContent = (content: string) =>
  request<Record<string, unknown>>("/api/calendar/reminders", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const listReminders = () => request<Record<string, unknown>[]>("/api/calendar/reminders");

export const patchReminder = (id: string, payload: Record<string, unknown>) =>
  request<Record<string, unknown>>(`/api/calendar/reminders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteReminder = (id: string) =>
  request<void>(`/api/calendar/reminders/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// --- Calendar: events ---
export const createCalendarEvent = (payload: Record<string, unknown>) =>
  request<Record<string, unknown>>("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listCalendarEvents = () =>
  request<Record<string, unknown>[]>("/api/calendar/events");

export const patchCalendarEvent = (id: string, payload: Record<string, unknown>) =>
  request<Record<string, unknown>>(`/api/calendar/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteCalendarEvent = (id: string) =>
  request<void>(`/api/calendar/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// --- Calendar: study & syllabus ---
export const parseSyllabus = (syllabusText: string) =>
  request<Record<string, unknown>>("/api/calendar/syllabus/parse", {
    method: "POST",
    body: JSON.stringify({ syllabusText }),
  });

export const createStudyPlan = (courses: Record<string, unknown>[], studyHoursPerWeek = 20) =>
  request<Record<string, unknown>>("/api/calendar/study-plan", {
    method: "POST",
    body: JSON.stringify({ courses, studyHoursPerWeek }),
  });

export const detectCalendarConflicts = (events: Record<string, unknown>[]) =>
  request<Record<string, unknown>>("/api/calendar/conflicts", {
    method: "POST",
    body: JSON.stringify({ events }),
  });

export const suggestStudyBlocks = (calendarEvents: Record<string, unknown>[] = []) =>
  request<unknown[]>("/api/calendar/study-blocks", {
    method: "POST",
    body: JSON.stringify({ calendarEvents }),
  });

export const getCalendarWorkload = (week: string) =>
  request<Record<string, unknown>>(`/api/calendar/workload/${encodeURIComponent(week)}`);

export const prioritizeAssignments = (assignments: Record<string, unknown>[]) =>
  request<unknown[]>("/api/calendar/assignments/priority", {
    method: "POST",
    body: JSON.stringify({ assignments }),
  });

// --- Calendar: deadlines & analytics ---
export const getUpcomingDeadlines = (days = 7) =>
  request<Record<string, unknown>>(`/api/calendar/deadlines/upcoming?days=${days}`);

export const getOverdueDeadlines = () =>
  request<Record<string, unknown>>("/api/calendar/deadlines/overdue");

export const createDeadlineMilestones = (deadlineId: string, bigProject: Record<string, unknown>) =>
  request<Record<string, unknown>>(
    `/api/calendar/deadlines/${encodeURIComponent(deadlineId)}/milestones`,
    {
      method: "POST",
      body: JSON.stringify({ big_project: bigProject }),
    }
  );

export const createDeadlineReminders = (deadlineId: string, taskSize = "medium") =>
  request<Record<string, unknown>>(
    `/api/calendar/deadlines/${encodeURIComponent(deadlineId)}/reminders`,
    {
      method: "POST",
      body: JSON.stringify({ task_size: taskSize }),
    }
  );

export const getCalendarTimeDistribution = (week?: string) => {
  const q = week ? `?week=${encodeURIComponent(week)}` : "";
  return request<Record<string, unknown>>(`/api/calendar/analytics/time-distribution${q}`);
};

export const getCalendarProcrastination = () =>
  request<Record<string, unknown>>("/api/calendar/analytics/procrastination");

export const getCalendarProductivityTips = () =>
  request<Record<string, unknown>>("/api/calendar/analytics/productivity-tips");

export const getCalendarFocusTimes = () =>
  request<Record<string, unknown>>("/api/calendar/analytics/focus-times");

// --- Budget: entries & summary ---
export const getBudgetSummary = () =>
  request<{
    totalIncome: number;
    totalSpent: number;
    remainingBalance: number;
  }>("/api/budget/summary");

export const listBudgetEntries = () => request<Record<string, unknown>[]>("/api/budget/entries");

export const createBudgetEntry = (payload: {
  title: string;
  amount: number;
  entry_type: string;
  category: string;
  date?: string;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  notes?: string | null;
}) =>
  request<Record<string, unknown>>("/api/budget/entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const patchBudgetEntry = (id: string, payload: Record<string, unknown>) =>
  request<Record<string, unknown>>(`/api/budget/entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const filterBudgetEntries = (params: Record<string, string | number | undefined>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const q = sp.toString();
  return request<Record<string, unknown>[]>(`/api/budget/entries/filter${q ? `?${q}` : ""}`);
};

export const getBudgetMonthlySummary = (month: string) =>
  request<Record<string, unknown>>(`/api/budget/summary/${encodeURIComponent(month)}`);

export const getBudgetCategoryBreakdown = (entryType: string, month?: string) => {
  const q = month ? `?month=${encodeURIComponent(month)}` : "";
  return request<Record<string, unknown>>(`/api/budget/breakdown/${encodeURIComponent(entryType)}${q}`);
};

export const getBudgetTrends = (months = 6) =>
  request<Record<string, unknown>>(`/api/budget/trends?months=${months}`);

export const getBudgetHealth = () => request<Record<string, unknown>>("/api/budget/health");

export const getBudgetAnomalies = () => request<unknown[]>("/api/budget/anomalies");

export const getBudgetForecast = () => request<Record<string, unknown>>("/api/budget/forecast");

export const getBudgetRecurring = () => request<unknown[]>("/api/budget/recurring");

export const createBudgetGoal = (payload: Record<string, unknown>) =>
  request<Record<string, unknown>>("/api/budget/goals", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listBudgetGoals = () => request<unknown[]>("/api/budget/goals");

export const getBudgetGoalsProgress = () =>
  request<Record<string, unknown>>("/api/budget/goals/progress");

export const getBudgetInsights = (month?: string) => {
  const q = month ? `?month=${encodeURIComponent(month)}` : "";
  return request<{ insights: unknown[]; recommendations: unknown[] }>(`/api/budget/insights${q}`);
};

export const getBudgetMonthlyReport = (month: string) =>
  request<Record<string, unknown>>(`/api/budget/reports/monthly/${encodeURIComponent(month)}`);

export const getBudgetYearlyReport = (year: string) =>
  request<Record<string, unknown>>(`/api/budget/reports/yearly/${encodeURIComponent(year)}`);

export const exportBudgetCsvBlob = (startDate: string, endDate: string) =>
  fetchBlob(
    `/api/budget/reports/export?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
  );

/** @deprecated Use createBudgetEntry — kept for older call sites */
export const addBudgetEntry = (entry: {
  title: string;
  amount: number;
  entryType: string;
}) =>
  createBudgetEntry({
    title: entry.title,
    amount: entry.amount,
    entry_type: entry.entryType,
    category: "general",
  });

// --- Agents ---
export const routeContent = (content: string) =>
  request<{ domain: string }>("/api/agents/route", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const processContent = (content: string, domain?: string | null) =>
  request<import("@/types").AgentProcessResult>("/api/agents/process", {
    method: "POST",
    body: JSON.stringify({ content, domain: domain ?? null }),
  });

export const getAgentMemory = (limit = 20) =>
  request<Record<string, unknown>[]>(`/api/agents/memory?limit=${limit}`);

export const processAgentFile = (file: File, domain?: string | null, persist = true) => {
  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  params.set("persist", persist ? "true" : "false");
  return uploadForm(`/api/agents/process-file?${params.toString()}`, file);
};

// --- Upload + agent (same as uploads POST) ---
export const uploadFileWithAgent = async (file: File) =>
  (await uploadForm("/api/uploads", file)) as import("@/types").UploadWithAgentResponse;

// --- Approvals ---
export const getPendingApprovals = () =>
  request<import("@/types").Approval[]>("/api/approvals/pending");

export const updateApproval = (id: string, approved: boolean) =>
  request<Record<string, unknown>>(`/api/approvals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ approved }),
  });
