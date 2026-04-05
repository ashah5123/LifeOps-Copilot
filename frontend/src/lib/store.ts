"use client";

import { create } from "zustand";

const STORAGE_KEY = "lifeops-state";
const LEGACY_STORAGE_KEY = "sparkup-state";

// --- localStorage helpers (SSR-safe) ---
function loadState(): Partial<PersistedState> {
  if (typeof window === "undefined") return {};
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(s: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  } catch { /* quota exceeded – ignore */ }
}

export interface AgentFeedItem {
  id: string;
  text: string;
  category: "inbox" | "career" | "calendar" | "budget";
  actionLabel: string;
  actionUrl: string;
  timestamp: string;
  domain: string;
  priority: string;
}

interface PersistedState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  /** JWT from email/password auth (sent as Bearer on API calls when persisted). */
  authToken: string | null;
  gmailConnected: boolean;
  theme: "light" | "dark";
  resumeFile: ResumeFile | null;
  monthlyBudget: number;
  budgetEntries: BudgetEntry[];
  notifications: Notification[];
  agentFeedItems: AgentFeedItem[];
}

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export interface ResumeFile {
  name: string;
  text: string;
  uploadedAt: string;
}

export interface BudgetEntry {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense" | "gift" | "scholarship";
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}


interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  gmailConnected: boolean;
  setGmailConnected: (connected: boolean) => void;

  isAuthenticated: boolean;
  user: UserProfile | null;
  authToken: string | null;
  login: (user: UserProfile, remember?: boolean, authToken?: string | null) => void;
  logout: () => void;
  /** Clear JWT session only (keeps theme, budget entries, etc.). */
  clearAuthSession: () => void;

  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;
  initTheme: () => void;

  // Resume persistence
  resumeFile: ResumeFile | null;
  setResumeFile: (file: ResumeFile | null) => void;

  // Budget
  monthlyBudget: number;
  setMonthlyBudget: (v: number) => void;
  budgetEntries: BudgetEntry[];
  addBudgetEntry: (e: BudgetEntry) => void;
  replaceBudgetEntries: (entries: BudgetEntry[]) => void;
  updateBudgetEntry: (id: string, patch: Partial<BudgetEntry>) => void;
  removeBudgetEntry: (id: string) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (items: Notification[]) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notification, "id">) => void;

  // Agent feed — real processed results
  agentFeedItems: AgentFeedItem[];
  addAgentFeedItem: (item: Omit<AgentFeedItem, "id">) => void;
  clearAgentFeed: () => void;
}

const persisted = loadState();

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  gmailConnected: persisted.gmailConnected ?? false,
  setGmailConnected: (connected) => {
    set({ gmailConnected: connected });
    saveState({ ...extractPersisted(get()), gmailConnected: connected });
  },

  isAuthenticated: persisted.isAuthenticated ?? false,
  user: persisted.user ?? null,
  authToken: persisted.authToken ?? null,
  login: (user, remember = true, authToken = null) => {
    set({ isAuthenticated: true, user, authToken });
    if (remember) {
      saveState(extractPersisted(get()));
    }
  },
  logout: () => {
    set({ isAuthenticated: false, user: null, gmailConnected: false, authToken: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  },
  clearAuthSession: () => {
    set({ isAuthenticated: false, user: null, authToken: null });
    saveState({
      ...extractPersisted(get()),
      isAuthenticated: false,
      user: null,
      authToken: null,
    });
  },

  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  theme: persisted.theme ?? "dark",
  toggleTheme: () =>
    set((s) => {
      const newTheme = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.className = `${newTheme} h-full`;
        document.documentElement.style.colorScheme = newTheme;
        try {
          localStorage.setItem("lifeops-theme", newTheme);
          localStorage.removeItem("sparkup-theme");
        } catch {
          /* ignore */
        }
      }
      const merged = { ...s, theme: newTheme } as AppState;
      saveState(extractPersisted(merged));
      return { theme: newTheme };
    }),
  initTheme: () => {
    const t = get().theme;
    if (typeof document !== "undefined") {
      document.documentElement.className = `${t} h-full`;
      document.documentElement.style.colorScheme = t;
      try {
        localStorage.setItem("lifeops-theme", t);
        localStorage.removeItem("sparkup-theme");
      } catch {
        /* ignore */
      }
    }
  },

  // Resume
  resumeFile: persisted.resumeFile ?? null,
  setResumeFile: (file) => {
    set({ resumeFile: file });
    saveState({ ...extractPersisted(get()), resumeFile: file });
  },

  // Budget
  monthlyBudget: persisted.monthlyBudget ?? 800,
  setMonthlyBudget: (v) => {
    set({ monthlyBudget: v });
    saveState({ ...extractPersisted(get()), monthlyBudget: v });
  },
  budgetEntries: persisted.budgetEntries ?? [],
  addBudgetEntry: (e) => {
    const entries = [...get().budgetEntries, e];
    set({ budgetEntries: entries });
    saveState({ ...extractPersisted(get()), budgetEntries: entries });
  },
  replaceBudgetEntries: (entries) => {
    set({ budgetEntries: entries });
    saveState({ ...extractPersisted(get()), budgetEntries: entries });
  },
  updateBudgetEntry: (id, patch) => {
    const entries = get().budgetEntries.map((e) => (e.id === id ? { ...e, ...patch } : e));
    set({ budgetEntries: entries });
    saveState({ ...extractPersisted(get()), budgetEntries: entries });
  },
  removeBudgetEntry: (id) => {
    const entries = get().budgetEntries.filter((e) => e.id !== id);
    set({ budgetEntries: entries });
    saveState({ ...extractPersisted(get()), budgetEntries: entries });
  },

  // Notifications
  notifications: persisted.notifications ?? [],
  setNotifications: (items) => {
    set({ notifications: items });
    saveState({ ...extractPersisted(get()), notifications: items });
  },
  markAllRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, unread: false }));
    set({ notifications: updated });
    saveState({ ...extractPersisted(get()), notifications: updated });
  },
  addNotification: (n) => {
    const notif = { ...n, id: crypto.randomUUID() };
    const list = [notif, ...get().notifications];
    set({ notifications: list });
    saveState({ ...extractPersisted(get()), notifications: list });
  },

  // Agent feed
  agentFeedItems: persisted.agentFeedItems ?? [],
  addAgentFeedItem: (item) => {
    const feed = [{ ...item, id: crypto.randomUUID() }, ...get().agentFeedItems].slice(0, 50);
    set({ agentFeedItems: feed });
    saveState({ ...extractPersisted(get()), agentFeedItems: feed });
  },
  clearAgentFeed: () => {
    set({ agentFeedItems: [] });
    saveState({ ...extractPersisted(get()), agentFeedItems: [] });
  },
}));

function extractPersisted(s: AppState): PersistedState {
  return {
    isAuthenticated: s.isAuthenticated,
    user: s.user,
    authToken: s.authToken,
    gmailConnected: s.gmailConnected,
    theme: s.theme,
    resumeFile: s.resumeFile,
    monthlyBudget: s.monthlyBudget,
    budgetEntries: s.budgetEntries,
    notifications: s.notifications,
    agentFeedItems: s.agentFeedItems,
  };
}
