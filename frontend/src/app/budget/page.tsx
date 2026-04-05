"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store";
import { mockBudgetSummary, mockBudgetEntries } from "@/lib/mock-data";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function CategoryBar({ category, amount, percentage, color }: {
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

export default function BudgetPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const addToast = useAppStore((s) => s.addToast);
  const summary = mockBudgetSummary;

  const spentPercentage = Math.round((summary.totalExpenses / summary.monthlyBudget) * 100);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Budget</h1>
            <p className="text-sm text-text-secondary mt-0.5">April 2026</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
            Add Expense
          </Button>
        </div>

        {/* Alerts */}
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
          {/* Summary Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Overview */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/* Budget Progress */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Monthly Budget</h3>
                <span className="text-xs text-text-secondary">
                  ${summary.totalExpenses.toFixed(2)} / ${summary.monthlyBudget.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${spentPercentage > 80 ? "bg-error" : spentPercentage > 60 ? "bg-warning" : "bg-success"}`}
                />
              </div>
              <p className="text-xs text-text-secondary">{spentPercentage}% of budget used</p>
            </Card>

            {/* Expense List */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Recent Transactions</h3>
              <Card padding="sm">
                <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/50">
                  {mockBudgetEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      variants={item}
                      className="flex items-center justify-between py-3 px-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          entry.type === "income" ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          {entry.type === "income" ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-text-secondary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{entry.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge>{entry.category}</Badge>
                            <span className="text-xs text-text-secondary">
                              {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${
                        entry.type === "income" ? "text-success" : "text-text-primary"
                      }`}>
                        {entry.type === "income" ? "+" : "-"}${entry.amount.toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </Card>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Category Breakdown</h3>
            <Card>
              {/* Simple donut visualization */}
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

        {/* Add Expense Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Expense">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowAddModal(false);
              addToast({ message: "Expense added!", type: "success" });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
              <input
                type="text"
                required
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
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Education</option>
                  <option>Entertainment</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
      </div>
    </AppShell>
  );
}
