"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store";
import { mockApplications, mockCareerSuggestions } from "@/lib/mock-data";
import * as api from "@/lib/api";
import type { Application } from "@/types";

const statusVariant: Record<Application["status"], "info" | "warning" | "success" | "error"> = {
  applied: "info",
  interview: "warning",
  offer: "success",
  rejected: "error",
};

const statusLabel: Record<Application["status"], string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function CareerPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<Application["status"] | "all">("all");
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const addToast = useAppStore((s) => s.addToast);

  useEffect(() => {
    api.listApplications().then((data) => {
      if (data && data.length > 0) {
        const mapped: Application[] = data.map((d: Record<string, unknown>) => ({
          id: String(d.id ?? d._id ?? ""),
          company: String(d.company ?? ""),
          role: String(d.role ?? ""),
          status: (["applied", "interview", "offer", "rejected"].includes(String(d.status))
            ? String(d.status)
            : "applied") as Application["status"],
          appliedDate: String(d.appliedDate ?? d.applied_date ?? new Date().toISOString()),
          deadline: d.deadline ? String(d.deadline) : undefined,
          notes: d.notes ? String(d.notes) : undefined,
          url: d.url ?? d.job_url ? String(d.url ?? d.job_url) : undefined,
        }));
        setApplications(mapped);
      }
    });
  }, []);

  const filteredApps = filter === "all"
    ? applications
    : applications.filter((a) => a.status === filter);

  const statusCounts = {
    all: applications.length,
    applied: applications.filter((a) => a.status === "applied").length,
    interview: applications.filter((a) => a.status === "interview").length,
    offer: applications.filter((a) => a.status === "offer").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Career Tracker</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {applications.length} applications tracked
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
            Add Application
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {(["all", "applied", "interview", "offer", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer
                    ${filter === s
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                    }
                  `}
                >
                  {s === "all" ? "All" : statusLabel[s]} ({statusCounts[s]})
                </button>
              ))}
            </div>

            {/* Application Cards */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filteredApps.map((app) => (
                <motion.div key={app.id} variants={item}>
                  <Card hover padding="md">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-text-secondary">
                            {app.company[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{app.role}</h3>
                          <p className="text-sm text-text-secondary">{app.company}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant={statusVariant[app.status]}>
                              {statusLabel[app.status]}
                            </Badge>
                            <span className="text-xs text-text-secondary">
                              Applied {new Date(app.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            {app.deadline && (
                              <span className="text-xs text-error font-medium">
                                Due {new Date(app.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                          {app.notes && (
                            <p className="text-xs text-text-secondary mt-2 italic">{app.notes}</p>
                          )}
                        </div>
                      </div>
                      {app.url && (
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-text-secondary" />
                        </button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* AI Suggestions Side Panel */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">AI Suggestions</h2>
            </div>
            <div className="space-y-3">
              {mockCareerSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card padding="sm" hover>
                    <h3 className="text-sm font-medium text-text-primary mb-1">
                      {suggestion.title}
                    </h3>
                    <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                      {suggestion.description}
                    </p>
                    <Button variant="ghost" size="sm">
                      {suggestion.actionLabel}
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Application Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Application">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              const company = formData.get("company") as string;
              const role = formData.get("role") as string;
              const status = (formData.get("status") as string) || "applied";
              const deadline = formData.get("deadline") as string;
              const notes = formData.get("notes") as string;

              const result = await api.createApplication({
                company,
                role,
                status,
                applied_date: new Date().toISOString(),
                notes: notes || undefined,
              });

              const newApp: Application = {
                id: String(result.id ?? `local-${Date.now()}`),
                company,
                role,
                status: status as Application["status"],
                appliedDate: new Date().toISOString(),
                deadline: deadline || undefined,
                notes: notes || undefined,
              };
              setApplications((prev) => [newApp, ...prev]);

              setShowAddModal(false);
              addToast({ message: "Application added!", type: "success" });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Company</label>
              <input
                type="text"
                name="company"
                required
                placeholder="e.g., Google"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Role</label>
              <input
                type="text"
                name="role"
                required
                placeholder="e.g., Software Engineering Intern"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Status</label>
                <select name="status" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
              <textarea
                name="notes"
                placeholder="Any notes about this application..."
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Application
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
