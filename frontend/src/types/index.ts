// Dashboard
export interface DashboardSummary {
  emailsNeedingReply: number;
  deadlines: number;
  tasksToday: number;
  budgetAlerts: number;
  inboxInsight: string;
  careerInsight: string;
  calendarInsight: string;
  budgetInsight: string;
}

// Feed
export interface FeedItem {
  id: string;
  text: string;
  category: "inbox" | "career" | "calendar" | "budget";
  actionLabel: string;
  actionUrl: string;
  timestamp: string;
}

// Upload
export interface UploadResponse {
  id: string;
  filename: string;
  status: "processing" | "completed" | "failed";
  category?: string;
}

// Gmail / Inbox
export interface GmailMessage {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  isUnread: boolean;
  labels: string[];
}

export interface AISummary {
  summary: string;
  keyPoints: string[];
  suggestedAction: string;
}

export interface AIDraftReply {
  draft: string;
  tone: string;
}

export interface SendEmailPayload {
  messageId: string;
  threadId: string;
  body: string;
  to: string;
}

// Career
export interface Application {
  id: string;
  company: string;
  role: string;
  status: "applied" | "interview" | "offer" | "rejected";
  appliedDate: string;
  deadline?: string;
  notes?: string;
  url?: string;
}

export interface CareerSuggestion {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
}

// Calendar
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "event" | "task" | "deadline";
  color?: string;
  description?: string;
}

export interface AISuggestedSlot {
  id: string;
  title: string;
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
}

// Budget
export interface BudgetEntry {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyBudget: number;
  categories: CategoryBreakdown[];
  alerts: BudgetAlert[];
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface BudgetAlert {
  id: string;
  message: string;
  severity: "warning" | "error" | "info";
}

// Approvals
export interface Approval {
  id: string;
  title: string;
  description: string;
  type: "email_send" | "calendar_create" | "budget_action" | "career_action";
  actionPreview: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  metadata?: Record<string, unknown>;
}
