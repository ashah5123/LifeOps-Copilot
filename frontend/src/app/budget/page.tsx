"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BanknotesIcon,
  PencilSquareIcon,
  TrashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import * as api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store";
import { mockBudgetSummary, mockBudgetEntries } from "@/lib/mock-data";
import type { BudgetEntry } from "@/types";

const BUDGET_STORAGE_KEY = "lifeops-budget-v1";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#4DA3FF",
  Education: "#22C55E",
  Entertainment: "#FFB020",
  Transport: "#8B5CF6",
  Income: "#22C55E",
  Other: "#94A3B8",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function aggregateExpenseCategories(entries: BudgetEntry[]) {
  const expenses = entries.filter((e) => e.type === "expense");
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) || 0) + e.amount);
  }
  const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  const raw = sorted.map(([category, amount]) => ({
    category,
    amount,
    percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    color: CATEGORY_COLORS[category] || "#94A3B8",
  }));
  const sumPct = raw.reduce((s, c) => s + c.percentage, 0);
  if (raw.length > 0 && sumPct !== 100 && total > 0) {
    raw[raw.length - 1] = {
      ...raw[raw.length - 1],
      percentage: raw[raw.length - 1].percentage + (100 - sumPct),
    };
  }
  return { totalExpenses: total, categories: raw };
}

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
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm text-text-primary">{category}</span>
        </div>
        <span className="text-sm font-medium text-text-primary">${amount.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
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

type StoredBudget = {
  entries: BudgetEntry[];
  totalIncome: number;
  monthlyBudget: number;
};

export default function BudgetPage() {
  const addToast = useAppStore((s) => s.addToast);

  const [entries, setEntries] = useState<BudgetEntry[]>(mockBudgetEntries);
  const [totalIncome, setTotalIncome] = useState(mockBudgetSummary.totalIncome);
  const [monthlyBudget, setMonthlyBudget] = useState(mockBudgetSummary.monthlyBudget);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);

  const [incomeInput, setIncomeInput] = useState(String(mockBudgetSummary.totalIncome));
  const [budgetInput, setBudgetInput] = useState(String(mockBudgetSummary.monthlyBudget));

  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [formCategory, setFormCategory] = useState("Food");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredBudget;
      if (parsed.entries?.length) setEntries(parsed.entries);
      if (typeof parsed.totalIncome === "number") {
        setTotalIncome(parsed.totalIncome);
        setIncomeInput(String(parsed.totalIncome));
      }
      if (typeof parsed.monthlyBudget === "number") {
        setMonthlyBudget(parsed.monthlyBudget);
        setBudgetInput(String(parsed.monthlyBudget));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const payload: StoredBudget = { entries, totalIncome, monthlyBudget };
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(payload));
  }, [entries, totalIncome, monthlyBudget]);

  const { totalExpenses, categories } = useMemo(() => aggregateExpenseCategories(entries), [entries]);
  const balance = totalIncome - totalExpenses;
  const spentPercentage =
    monthlyBudget > 0 ? Math.min(100, Math.round((totalExpenses / monthlyBudget) * 100)) : 0;

  const summary = mockBudgetSummary;

  const resetAddForm = () => {
    setFormDesc("");
    setFormAmount("");
    setFormType("expense");
    setFormCategory("Food");
    setFormDate(new Date().toISOString().slice(0, 10));
  };

  const openAdd = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      addToast({ message: "Enter a valid amount", type: "warning" });
      return;
    }
    const id = `b-${Date.now()}`;
    setEntries((prev) => [
      {
        id,
        description: formDesc.trim() || "Untitled",
        amount,
        category: formCategory,
        date: formDate,
        type: formType,
      },
      ...prev,
    ]);
    setShowAddModal(false);
    resetAddForm();
    addToast({ message: formType === "income" ? "Income entry added" : "Expense added", type: "success" });

    // Fire-and-forget sync to backend
    api.createBudgetEntry({
      title: formDesc.trim() || "Untitled",
      amount,
      entry_type: formType,
      category: formCategory,
      date: formDate,
    }).catch(() => {});
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remove this transaction?")) return;
    setEntries((prev) => prev.filter((x) => x.id !== id));
    addToast({ message: "Transaction removed", type: "info" });
  };

  const openEdit = (entry: BudgetEntry) => {
    setEditingEntry(entry);
    setFormDesc(entry.description);
    setFormAmount(String(entry.amount));
    setFormType(entry.type);
    setFormCategory(entry.category);
    setFormDate(entry.date);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    const amount = parseFloat(formAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      addToast({ message: "Enter a valid amount", type: "warning" });
      return;
    }
    setEntries((prev) =>
      prev.map((x) =>
        x.id === editingEntry.id
          ? {
              ...x,
              description: formDesc.trim() || "Untitled",
              amount,
              category: formCategory,
              date: formDate,
              type: formType,
            }
          : x
      )
    );
    setEditingEntry(null);
    addToast({ message: "Transaction updated", type: "success" });

    // Fire-and-forget sync to backend
    api.updateBudgetEntry(editingEntry.id, {
      title: formDesc.trim() || "Untitled",
      amount,
      entry_type: formType,
      category: formCategory,
      date: formDate,
    }).catch(() => {});
  };

  const saveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(incomeInput);
    if (Number.isNaN(v) || v < 0) {
      addToast({ message: "Enter a valid income amount", type: "warning" });
      return;
    }
    setTotalIncome(v);
    setShowIncomeModal(false);
    addToast({ message: "Total income updated", type: "success" });
  };

  const saveBudgetLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(budgetInput);
    if (Number.isNaN(v) || v <= 0) {
      addToast({ message: "Enter a valid monthly budget", type: "warning" });
      return;
    }
    setMonthlyBudget(v);
    setShowBudgetModal(false);
    addToast({ message: "Monthly budget updated", type: "success" });
  };

  const bumpBudget = (delta: number) => {
    setMonthlyBudget((b) => Math.max(1, Math.round((b + delta) * 100) / 100));
  };

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries]
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Budget</h1>
            <p className="mt-0.5 text-sm text-text-secondary">April 2026</p>
          </div>
          <Button onClick={openAdd} icon={<PlusIcon className="h-4 w-4" />}>
            Add Expense
          </Button>
        </div>

        {summary.alerts.length > 0 && (
          <motion.div variants={container} initial="hidden" animate="show" className="mb-6 space-y-2">
            {summary.alerts.map((alert) => (
              <motion.div
                key={alert.id}
                variants={item}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  alert.severity === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100"
                    : alert.severity === "error"
                      ? "border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/35 dark:text-red-100"
                      : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/35 dark:text-blue-100"
                }`}
              >
                {alert.severity === "warning" || alert.severity === "error" ? (
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
                )}
                <p className="text-sm">{alert.message}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <motion.div variants={item}>
                <Card padding="md">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/50">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-xs text-text-secondary">Income</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIncomeInput(String(totalIncome));
                        setShowIncomeModal(true);
                      }}
                      className="rounded-lg p-1.5 text-text-secondary transition hover:bg-white/10 hover:text-text-primary"
                      title="Edit total income"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-success">${totalIncome.toFixed(2)}</p>
                  <p className="mt-1 text-[11px] text-text-secondary">Your expected total income for the month</p>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card padding="md">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/50">
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-xs text-text-secondary">Expenses</p>
                    <LockClosedIcon className="ml-auto h-3.5 w-3.5 text-text-secondary/70" title="Sum of expenses" />
                  </div>
                  <p className="text-2xl font-bold text-error">${totalExpenses.toFixed(2)}</p>
                  <p className="mt-1 text-[11px] text-text-secondary">Auto from your transactions</p>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card padding="md">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                      <BanknotesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs text-text-secondary">Balance</p>
                    <LockClosedIcon className="ml-auto h-3.5 w-3.5 text-text-secondary/70" title="Income minus expenses" />
                  </div>
                  <p className="text-2xl font-bold text-primary">${balance.toFixed(2)}</p>
                  <p className="mt-1 text-[11px] text-text-secondary">Income − expenses</p>
                </Card>
              </motion.div>
            </motion.div>

            <Card>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-text-primary">Monthly Budget</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-lg border border-border bg-background/80">
                    <button
                      type="button"
                      onClick={() => bumpBudget(-50)}
                      className="px-2.5 py-1 text-sm text-text-secondary hover:bg-white/10 hover:text-text-primary"
                      title="Decrease by $50"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => bumpBudget(50)}
                      className="px-2.5 py-1 text-sm text-text-secondary hover:bg-white/10 hover:text-text-primary"
                      title="Increase by $50"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-text-secondary">
                    ${totalExpenses.toFixed(2)} / ${monthlyBudget.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetInput(String(monthlyBudget));
                      setShowBudgetModal(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    Edit limit
                  </button>
                </div>
              </div>
              <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    spentPercentage > 80 ? "bg-error" : spentPercentage > 60 ? "bg-warning" : "bg-success"
                  }`}
                />
              </div>
              <p className="text-xs text-text-secondary">{spentPercentage}% of budget used</p>
            </Card>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-text-primary">Recent Transactions</h3>
              <Card padding="sm">
                <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/50">
                  {sortedEntries.map((entry) => (
                    <motion.div key={entry.id} variants={item} className="flex items-center justify-between gap-2 py-3 pr-1 pl-2">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                            entry.type === "income" ? "bg-green-100 dark:bg-green-950/50" : "bg-gray-100 dark:bg-white/10"
                          }`}
                        >
                          {entry.type === "income" ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 text-text-secondary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">{entry.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{entry.category}</Badge>
                            <span className="text-xs text-text-secondary">
                              {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <p
                          className={`text-sm font-semibold ${
                            entry.type === "income" ? "text-success" : "text-text-primary"
                          }`}
                        >
                          {entry.type === "income" ? "+" : "-"}${entry.amount.toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => openEdit(entry)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-white/10 hover:text-text-primary"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-red-500/15 hover:text-red-400"
                          title="Remove"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Category Breakdown</h3>
            <Card>
              <div className="mb-6 flex items-center justify-center">
                <div className="relative h-36 w-36">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    {categories.length === 0 ? (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-white/10"
                        strokeDasharray="100 0"
                      />
                    ) : (
                      categories.map((cat, i) => {
                        const dash = cat.percentage;
                        const currentOffset = categories.slice(0, i).reduce((sum, c) => sum + c.percentage, 0);
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
                      })
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-text-primary">${totalExpenses.toFixed(0)}</p>
                    <p className="text-xs text-text-secondary">Total Spent</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {categories.length === 0 ? (
                  <p className="text-center text-sm text-text-secondary">No expense categories yet</p>
                ) : (
                  categories.map((cat) => <CategoryBar key={cat.category} {...cat} />)
                )}
              </div>
            </Card>
          </div>
        </div>

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add transaction">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Description</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                required
                placeholder="e.g., Coffee Shop"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Amount</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as "expense" | "income")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Education</option>
                  <option>Entertainment</option>
                  <option>Income</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Entry
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!editingEntry} onClose={() => setEditingEntry(null)} title="Edit transaction">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Description</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Amount</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as "expense" | "income")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Education</option>
                  <option>Entertainment</option>
                  <option>Income</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setEditingEntry(null)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={showIncomeModal} onClose={() => setShowIncomeModal(false)} title="Total monthly income">
          <form onSubmit={saveIncome} className="space-y-4">
            <p className="text-sm text-text-secondary">
              This is your expected total income for the month. Expenses and balance stay calculated from your transactions.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowIncomeModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Monthly budget limit">
          <form onSubmit={saveBudgetLimit} className="space-y-4">
            <p className="text-sm text-text-secondary">Set the cap you want to track against for the month.</p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Limit ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowBudgetModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
