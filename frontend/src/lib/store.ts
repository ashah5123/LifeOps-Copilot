"use client";

import { create } from "zustand";
import type { CalendarEvent } from "@/types";
import { mockCalendarEvents } from "@/lib/mock-data";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface User {
  name: string;
  email: string;
  initials: string;
  /** First name for greetings (from signup or derived from name). */
  firstName?: string;
  location?: string;
  state?: string;
  timezone?: string;
}

interface AppState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  initTheme: () => void;
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  initAuth: () => void;
  gmailConnected: boolean;
  setGmailConnected: (v: boolean) => void;
  _isHydrated: boolean;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  calendarEvents: CalendarEvent[];
  calendarHydrated: boolean;
  initCalendarEvents: () => void;
  addCalendarEvent: (event: CalendarEvent) => void;
}

function applyThemeClass(theme: "light" | "dark") {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: "dark",
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyThemeClass(next);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sparkup-theme", next);
    }
    set({ theme: next });
  },
  initTheme: () => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("sparkup-theme") as "light" | "dark" | null;
      const theme = saved || "dark";
      applyThemeClass(theme);
      set({ theme });
    } else {
      applyThemeClass("dark");
    }
  },
  user: null,
  isAuthenticated: false,
  login: (user) => {
    set({ user, isAuthenticated: true });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sparkup-user", JSON.stringify(user));
      localStorage.setItem("sparkup-auth", "true");
    }
  },
  logout: () => {
    set({ user: null, isAuthenticated: false, gmailConnected: false });
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("sparkup-user");
      localStorage.removeItem("sparkup-auth");
    }
  },
  initAuth: () => {
    if (typeof localStorage !== "undefined") {
      const auth = localStorage.getItem("sparkup-auth");
      const userData = localStorage.getItem("sparkup-user");
      if (auth === "true" && userData) {
        try {
          const user = JSON.parse(userData) as User;
          set({ user, isAuthenticated: true });
        } catch {
          // ignore bad data
        }
      }
    }
    set({ _isHydrated: true });
  },
  _isHydrated: false,
  gmailConnected: false,
  setGmailConnected: (v) => set({ gmailConnected: v }),
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
  calendarEvents: [],
  calendarHydrated: false,
  initCalendarEvents: () => {
    if (get().calendarHydrated) return;
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("lifeops-calendar-events");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as CalendarEvent[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            set({ calendarEvents: parsed, calendarHydrated: true });
            return;
          }
        } catch {
          /* use defaults */
        }
      }
    }
    const seed = mockCalendarEvents.map((e) => ({ ...e }));
    set({ calendarEvents: seed, calendarHydrated: true });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("lifeops-calendar-events", JSON.stringify(seed));
    }
  },
  addCalendarEvent: (event) => {
    set((s) => {
      const next = [...s.calendarEvents, event];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("lifeops-calendar-events", JSON.stringify(next));
      }
      return { calendarEvents: next };
    });
  },
}));

export { US_STATES } from "./country-states";
