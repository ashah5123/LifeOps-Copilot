"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  GiftIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useAppStore, type BudgetEntry } from "@/lib/store";
import { mockBudgetSummary, mockBudgetEntries } from "@/lib/mock-data";

/* ── animation variants ──────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/* ── helpers ─────────────────────────────────────────── */
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function entryTypeLabel(t: string) {
  switch (t) {
    case "income": return "Income";
    case "expense": return "Expense";
    case "gift": return "Gift Card";
    case "scholarship": return "Scholarship";
    default: return t;
  }
}

function entryBadgeVariant(t: string): "default" | "success" | "warning" | "error" | "info" {
  switch (t) {
    case "income": return "success";
    case "gift": return "warning";
    case "scholarship": return "info";
    default: return "default";
  }
}

/* ── Category bar sub-component ──────────────────────── */
function CategoryBar({
  category,
  amount,
  percentage,
  color,
}: {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm text-text-primary">{category}</span>
        </div>
        <span className="text-sm font-medium text-text-primary">${amount.toFixed(2)}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── CSV / PDF export helpers ────────────────────────── */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(entries: BudgetEntry[]) {
  const header = "ID,Description,Amount,Category,Date,Type";
  const rows = entries.map(
    (e) => `"${e.id}","${e.description}",${e.amount},"${e.category}","${e.date}","${e.type}"`,
  );
  const csv = [header, ...rows].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv" }), "sparkup-budget.csv");
}

function exportPDF(entries: BudgetEntry[], monthlyBudget: number) {
  const lines = [
    "SparkUp Budget Report",
    "=====================",
    "",
    `Monthly Budget: $${monthlyBudget.toFixed(2)}`,
    "",
    "Date        | Type          | Category       | Description                  | Amount",
    "------------|---------------|----------------|------------------------------|--------",
    ...entries.map(
      (e) =>
        `${e.date}  | ${entryTypeLabel(e.type).padEnd(13)} | ${e.category.padEnd(14)} | ${e.description.padEnd(28)} | $${e.amount.toFixed(2)}`,
    ),
  ];
  downloadBlob(
    new Blob([lines.join("\n")], { type: "application/pdf" }),
    "sparkup-budget.pdf",
  );
}

/* ════════════════════════════════════════════════════════
   Budget Page
   ════════════════════════════════════════════════════════ */
export default function BudgetPage() {
  /* ── store ──────────────────────────────────────────── */
  const addToast = useAppStore((s) => s.addToast);
  const monthlyBudget = useAppStore((s) => s.monthlyBudget);
  const setMonthlyBudget = useAppStore((s) => s.setMonthlyBudget);
  const budgetEntries = useAppStore((s) => s.budgetEntries);
  const addBudgetEntry = useAppStore((s) => s.addBudgetEntry);
  const removeBudgetEntry = useAppStore((s) => s.removeBudgetEntry);

  /* ── combined entries (mock + persisted) ────────────── */
  const allEntries = useMemo(() => {
    const storeIds = new Set(budgetEntries.map((e) => e.id));
    const deduped = mockBudgetEntries.filter((e) => !storeIds.has(e.id));
    return [...deduped, ...budgetEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [budgetEntries]);

  /* ── computed summary (dynamic from all entries) ───── */
  const summary = useMemo(() => {
    const totalIncome = allEntries
      .filter((e) => e.type === "income" || e.type === "gift" || e.type === "scholarship")
      .reduce((s, e) => s + e.amount, 0);
    const totalExpenses = allEntries
      .filter((e) => e.type === "expense")
      .reduce((s, e) => s + e.amount, 0);

    // Category breakdown for expenses
    const catMap: Record<string, number> = {};
    allEntries
      .filter((e) => e.type === "expense")
      .forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
      });
    const catColors: Record<string, string> = {
      Food: "#4DA3FF",
      Education: "#22C55E",
      Entertainment: "#FFB020",
      Transport: "#8B5CF6",
      Other: "#6B7280",
    };
    const categories = Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      color: catColors[category] || "#6B7280",
    }));

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      categories,
      alerts: mockBudgetSummary.alerts,
    };
  }, [allEntries]);

  const spentPercentage = monthlyBudget > 0 ? Math.round((summary.totalExpenses / monthlyBudget) * 100) : 0;

  /* ── local UI state ────────────────────────────────── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(monthlyBudget));

  // Add entry form state
  const [entryDesc, setEntryDesc] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryType, setEntryType] = useState<BudgetEntry["type"]>("expense");
  const [entryCategory, setEntryCategory] = useState("Food");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  /* ── calendar derived data ─────────────────────────── */
  const totalDays = daysInMonth(calYear, calMonth);
  const startDay = firstDayOfMonth(calYear, calMonth);

  const expensesByDay = useMemo(() => {
    const map: Record<string, number> = {};
    allEntries
      .filter((e) => e.type === "expense")
      .forEach((e) => {
        map[e.date] = (map[e.date] || 0) + e.amount;
      });
    return map;
  }, [allEntries]);

  const maxDayExpense = useMemo(() => {
    return Math.max(...Object.values(expensesByDay), 1);
  }, [expensesByDay]);

  /* ── filtered transactions for display ─────────────── */
  const displayedEntries = useMemo(() => {
    if (!selectedDay) return allEntries;
    return allEntries.filter((e) => e.date === selectedDay);
  }, [allEntries, selectedDay]);

  /* ── calendar navigation ───────────────────────────── */
  function prevMonth() {
    setSelectedDay(null);
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  /* ── form helpers ──────────────────────────────────── */
  function resetForm() {
    setEntryDesc("");
    setEntryAmount("");
    setEntryType("expense");
    setEntryCategory("Food");
    setEntryDate(new Date().toISOString().slice(0, 10));
  }

  function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    const entry: BudgetEntry = {
      id: crypto.randomUUID(),
      description: entryDesc,
      amount: parseFloat(entryAmount),
      category: entryCategory,
      date: entryDate,
      type: entryType,
    };
    addBudgetEntry(entry);
    setShowAddModal(false);
    resetForm();
    addToast({ message: `${entryTypeLabel(entryType)} added!`, type: "success" });
  }

  function saveBudget() {
    const val = parseFloat(budgetDraft);
    if (!isNaN(val) && val > 0) {
      setMonthlyBudget(val);
      addToast({ message: "Monthly budget updated", type: "success" });
    }
    setEditingBudget(false);
  }

  /* ── entry icon helper ─────────────────────────────── */
  function EntryIcon({ type }: { type: string }) {
    switch (type) {
      case "income":
        return (
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
          </div>
        );
      case "gift":
        return (
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <GiftIcon className="w-4 h-4 text-amber-600" />
          </div>
        );
      case "scholarship":
        return (
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <AcademicCapIcon className="w-4 h-4 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <ArrowTrendingDownIcon className="w-4 h-4 text-text-secondary" />
          </div>
        );
    }
  }

  /* ════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════ */
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Budget</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {MONTH_NAMES[calMonth]} {calYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
              onClick={() => exportCSV(allEntries)}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<DocumentTextIcon className="w-4 h-4" />}
              onClick={() => exportPDF(allEntries, monthlyBudget)}
            >
              Export PDF
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Add Entry
            </Button>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────── */}
        {summary.alerts.length > 0 && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2 mb-6">
            {summary.alerts.map((alert) => (
              <motion.div
                key={alert.id}
                variants={item}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  alert.severity === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : alert.severity === "error"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                {alert.severity === "warning" || alert.severity === "error" ? (
                  <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm">{alert.message}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT COLUMN ───────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Income card */}
              <motion.div variants={item}>
                <Card padding="md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs text-text-secondary">Income</p>
                  </div>
                  <p className="text-2xl font-bold text-success">${summary.totalIncome.toFixed(2)}</p>
                </Card>
              </motion.div>

              {/* Expenses card */}
              <motion.div variants={item}>
                <Card padding="md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-xs text-text-secondary">Expenses</p>
                  </div>
                  <p className="text-2xl font-bold text-error">${summary.totalExpenses.toFixed(2)}</p>
                </Card>
              </motion.div>

              {/* Balance card */}
              <motion.div variants={item}>
                <Card padding="md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BanknotesIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-text-secondary">Balance</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">${summary.balance.toFixed(2)}</p>
                </Card>
              </motion.div>
            </motion.div>

            {/* Budget Progress (editable) */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Monthly Budget</h3>
                <div className="flex items-center gap-2">
                  {editingBudget ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-secondary">$</span>
                      <input
                        type="number"
                        value={budgetDraft}
                        onChange={(e) => setBudgetDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveBudget(); if (e.key === "Escape") setEditingBudget(false); }}
                        className="w-24 px-2 py-1 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                      />
                      <button
                        onClick={saveBudget}
                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setBudgetDraft(String(monthlyBudget)); setEditingBudget(true); }}
                      className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                      ${summary.totalExpenses.toFixed(2)} / ${monthlyBudget.toFixed(2)}
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    spentPercentage > 80 ? "bg-error" : spentPercentage > 60 ? "bg-warning" : "bg-success"
                  }`}
                />
              </div>
              <p className="text-xs text-text-secondary">{spentPercentage}% of budget used</p>
            </Card>

            {/* ── Calendar View ───────────────────────── */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Monthly Expenses Calendar</h3>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
                  </button>
                  <span className="text-sm font-medium text-text-primary min-w-[130px] text-center">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              </div>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-text-secondary py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14" />
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1;
                  const dateKey = toDateKey(calYear, calMonth, day);
                  const expense = expensesByDay[dateKey] || 0;
                  const isSelected = selectedDay === dateKey;
                  const intensity = expense > 0 ? Math.max(0.15, expense / maxDayExpense) : 0;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                      className={`relative h-14 rounded-lg text-xs flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer
                        ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-gray-50"}`}
                    >
                      <span className={`font-medium ${isSelected ? "text-primary" : "text-text-primary"}`}>
                        {day}
                      </span>
                      {expense > 0 && (
                        <>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: `rgba(239, 68, 68, ${intensity})` }}
                          />
                          <span className="text-[10px] text-text-secondary">${expense.toFixed(0)}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDay && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-secondary">
                    Showing transactions for{" "}
                    <span className="font-medium text-text-primary">
                      {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="ml-2 text-primary hover:underline cursor-pointer"
                    >
                      Clear filter
                    </button>
                  </p>
                </div>
              )}
            </Card>

            {/* ── Transaction List ────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                {selectedDay ? "Filtered Transactions" : "Recent Transactions"}
              </h3>
              <Card padding="sm">
                {displayedEntries.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-8">No transactions for this day.</p>
                ) : (
                  <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/50">
                    {displayedEntries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        variants={item}
                        className="flex items-center justify-between py-3 px-2"
                      >
                        <div className="flex items-center gap-3">
                          <EntryIcon type={entry.type} />
                          <div>
                            <p className="text-sm font-medium text-text-primary">{entry.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge>{entry.category}</Badge>
                              {(entry.type === "gift" || entry.type === "scholarship") && (
                                <Badge variant={entryBadgeVariant(entry.type)}>
                                  {entryTypeLabel(entry.type)}
                                </Badge>
                              )}
                              <span className="text-xs text-text-secondary">
                                {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold ${
                              entry.type === "income" || entry.type === "gift" || entry.type === "scholarship"
                                ? "text-success"
                                : "text-text-primary"
                            }`}
                          >
                            {entry.type === "expense" ? "-" : "+"}${entry.amount.toFixed(2)}
                          </p>
                          {/* Only show delete for store entries (not mock) */}
                          {budgetEntries.some((e) => e.id === entry.id) && (
                            <button
                              onClick={() => {
                                removeBudgetEntry(entry.id);
                                addToast({ message: "Entry removed", type: "info" });
                              }}
                              className="p-1 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </Card>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Category Breakdown ──────── */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Category Breakdown</h3>
            <Card>
              {/* Donut chart */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      return summary.categories.map((cat) => {
                        const dash = (cat.percentage / 100) * 100;
                        const currentOffset = offset;
                        offset += dash;
                        return (
                          <circle
                            key={cat.category}
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="3"
                            strokeDasharray={`${dash} ${100 - dash}`}
                            strokeDashoffset={-currentOffset}
                            strokeLinecap="round"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-text-primary">${summary.totalExpenses.toFixed(0)}</p>
                    <p className="text-xs text-text-secondary">Total Spent</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {summary.categories.map((cat) => (
                  <CategoryBar key={cat.category} {...cat} />
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── Add Entry Modal ─────────────────────────── */}
        <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Entry">
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
              <input
                type="text"
                required
                value={entryDesc}
                onChange={(e) => setEntryDesc(e.target.value)}
                placeholder="e.g., Coffee Shop"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Amount</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as BudgetEntry["type"])}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="gift">Gift Card</option>
                  <option value="scholarship">Scholarship</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Education</option>
                  <option>Entertainment</option>
                  <option>Income</option>
                  <option>Scholarship</option>
                  <option>Gift</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Type-specific hint */}
            {(entryType === "gift" || entryType === "scholarship") && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700">
                <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                {entryType === "gift"
                  ? "Gift cards are counted as income and shown with a special badge."
                  : "Scholarships are counted as income and shown with a special badge."}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Entry
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
