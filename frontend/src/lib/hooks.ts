"use client";

import useSWR from "swr";
import * as api from "./api";
import type { DashboardSummary, FeedItem, GmailMessage, Approval } from "@/types";

// Generic fetcher wrapper for SWR
const swrOptions = {
  revalidateOnFocus: false,
  shouldRetryOnError: true,
  errorRetryCount: 2,
};

export function useDashboardSummary() {
  return useSWR<DashboardSummary>("dashboard-summary", api.getDashboardSummary, swrOptions);
}

export function useTodayFeed() {
  return useSWR<FeedItem[]>("today-feed", api.getTodayFeed, swrOptions);
}

export function useGmailMessages() {
  return useSWR<GmailMessage[]>("gmail-messages", api.getGmailMessages, swrOptions);
}

export function useBudgetSummary() {
  return useSWR<{
    totalIncome: number;
    totalSpent: number;
    remainingBalance: number;
  }>("budget-summary", api.getBudgetSummary, swrOptions);
}

export function usePendingApprovals() {
  return useSWR<Approval[]>("pending-approvals", api.getPendingApprovals, swrOptions);
}
