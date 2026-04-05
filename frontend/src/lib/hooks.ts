/**
 * Custom React hooks for data fetching from the backend API.
 *
 * Each hook returns { data, loading, error, refetch }.
 * If the backend is unreachable, the data falls back to mock values
 * (handled inside the api.ts helpers).
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import * as api from "./api";

// ---------------------------------------------------------------------------
// Generic hook builder
// ---------------------------------------------------------------------------

interface UseFetchResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(fetcher: () => Promise<T>, initial: T): UseFetchResult<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(String(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function useDashboardSummary() {
  const fetcher = useCallback(() => api.getDashboardSummary(), []);
  return useFetch(fetcher, {
    todayTasks: 0,
    upcomingDeadlines: 0,
    pendingApprovals: 0,
    recentActivity: [] as string[],
  });
}

export function useTodayFeed() {
  const fetcher = useCallback(() => api.getTodayFeed(), []);
  return useFetch(fetcher, []);
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

export function useGmailMessages() {
  const fetcher = useCallback(() => api.listGmailMessages(), []);
  return useFetch(fetcher, []);
}

// ---------------------------------------------------------------------------
// Career
// ---------------------------------------------------------------------------

export function useApplications() {
  const fetcher = useCallback(() => api.listApplications(), []);
  return useFetch(fetcher, []);
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

export function useCalendarEvents() {
  const fetcher = useCallback(() => api.listCalendarEvents(), []);
  return useFetch(fetcher, []);
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export function useBudgetEntries() {
  const fetcher = useCallback(() => api.listBudgetEntries(), []);
  return useFetch(fetcher, []);
}

export function useBudgetSummary() {
  const fetcher = useCallback(() => api.getBudgetSummary(), []);
  return useFetch(fetcher, { totalIncome: 0, totalSpent: 0, remainingBalance: 0 });
}

export function useBudgetHealth() {
  const fetcher = useCallback(() => api.getBudgetHealth(), []);
  return useFetch(fetcher, { score: 0, grade: "N/A", advice: "" });
}

export function useBudgetInsights() {
  const fetcher = useCallback(() => api.getBudgetInsights(), []);
  return useFetch(fetcher, { insights: [], recommendations: [] });
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export function usePendingApprovals() {
  const fetcher = useCallback(() => api.listPendingApprovals(), []);
  return useFetch(fetcher, []);
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export function useHealthCheck() {
  const fetcher = useCallback(() => api.checkHealth(), []);
  return useFetch(fetcher, { status: "unknown", service: "SparkUp API" });
}
