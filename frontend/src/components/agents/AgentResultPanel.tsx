"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  InboxIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import type { AgentProcessResult } from "@/types";

const domainConfig: Record<string, { icon: typeof InboxIcon; color: string; bg: string; label: string }> = {
  inbox: { icon: InboxIcon, color: "text-blue-600", bg: "bg-blue-100", label: "Inbox & Action" },
  career: { icon: BriefcaseIcon, color: "text-purple-600", bg: "bg-purple-100", label: "Career Copilot" },
  calendar: { icon: CalendarDaysIcon, color: "text-green-600", bg: "bg-green-100", label: "Calendar Manager" },
  budget: { icon: BanknotesIcon, color: "text-amber-600", bg: "bg-amber-100", label: "Budget Copilot" },
  mixed: { icon: SparklesIcon, color: "text-pink-600", bg: "bg-pink-100", label: "Multi-Domain" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  high: { color: "text-red-700", bg: "bg-red-100" },
  medium: { color: "text-amber-700", bg: "bg-amber-100" },
  low: { color: "text-green-700", bg: "bg-green-100" },
};

interface Props {
  result: AgentProcessResult;
  fileName?: string;
  onClose: () => void;
  onApprove?: () => void;
}

export default function AgentResultPanel({ result, fileName, onClose, onApprove }: Props) {
  const domain = domainConfig[result.domain] || domainConfig.mixed;
  const priority = priorityConfig[result.priority] || priorityConfig.medium;
  const DomainIcon = domain.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${domain.bg} flex items-center justify-center`}>
              <DomainIcon className={`w-5 h-5 ${domain.color}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{result.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${domain.bg} ${domain.color}`}>
                  {domain.label}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                  {result.priority} priority
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Pipeline visualization */}
        <div className="px-5 py-3 border-b border-border bg-gray-50/50">
          <div className="flex items-center gap-1 text-xs">
            {["Router", "Extractor", "Planner", "Review", "Action", "Memory"].map((step, i) => (
              <span key={step} className="flex items-center gap-1">
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  <CheckCircleIcon className="w-3 h-3" />
                  {step}
                </span>
                {i < 5 && <span className="text-text-secondary">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* File info */}
          {fileName && (
            <p className="text-xs text-text-secondary">
              Source: <span className="font-medium text-text-primary">{fileName}</span>
            </p>
          )}

          {/* Detail */}
          {result.detail && (
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-1">Summary</h4>
              <p className="text-sm text-text-secondary">{result.detail}</p>
            </div>
          )}

          {/* Extracted Fields */}
          {Object.keys(result.extractedFields).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">Extracted Information</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.extractedFields).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-text-secondary capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {result.recommendedActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">Recommended Actions</h4>
              <ul className="space-y-1.5">
                {result.recommendedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Review note */}
          {result.reviewNote && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${result.requiresApproval ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
              {result.requiresApproval ? (
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ) : (
                <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-medium text-text-primary">
                  {result.requiresApproval ? "Approval Required" : "Auto-Approved"}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{result.reviewNote}</p>
              </div>
            </div>
          )}

          {/* Confidence bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-secondary">AI Confidence</span>
              <span className="font-medium text-text-primary">{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {result.requiresApproval && onApprove && (
          <div className="px-5 py-3 border-t border-border bg-gray-50/50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={onApprove}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Approve Action
            </button>
          </div>
        )}

        {/* Memory ID footer */}
        {result.memoryId && (
          <div className="px-5 py-2 border-t border-border">
            <p className="text-xs text-text-secondary flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              Stored in memory: {result.memoryId.slice(0, 8)}...
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
