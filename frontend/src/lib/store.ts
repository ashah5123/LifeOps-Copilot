"use client";

import { create } from "zustand";

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  gmailConnected: boolean;
  setGmailConnected: (connected: boolean) => void;

  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;

  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;
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

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  gmailConnected: false,
  setGmailConnected: (connected) => set({ gmailConnected: connected }),

  isAuthenticated: false,
  user: null,
  login: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null, gmailConnected: false }),

  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  theme: "light",
  toggleTheme: () =>
    set((s) => {
      const newTheme = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      }
      return { theme: newTheme };
    }),
}));