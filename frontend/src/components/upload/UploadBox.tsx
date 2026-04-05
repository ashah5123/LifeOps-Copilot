"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudArrowUpIcon, CheckCircleIcon, DocumentIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";
import { uploadFileWithAgent, processContent } from "@/lib/api";
import AgentResultPanel from "@/components/agents/AgentResultPanel";
import type { AgentProcessResult } from "@/types";

type Phase = "idle" | "uploading" | "processing" | "done";

export default function UploadBox() {
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [agentResult, setAgentResult] = useState<AgentProcessResult | null>(null);
  const addToast = useAppStore((s) => s.addToast);
  const setResumeFile = useAppStore((s) => s.setResumeFile);
  const addNotification = useAppStore((s) => s.addNotification);
  const addAgentFeedItem = useAppStore((s) => s.addAgentFeedItem);
  const resumeFile = useAppStore((s) => s.resumeFile);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setPhase("uploading");
    setProgress(0);
    setAgentResult(null);

    // Simulate upload progress while actually uploading
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 60));
    }, 200);

    try {
      // Read file text for .txt files (for store persistence)
      let text = "";
      if (file.name.endsWith(".txt")) {
        text = await file.text();
      }

      // Send to backend — this does extraction + agent pipeline
      const response = await uploadFileWithAgent(file);

      clearInterval(progressInterval);
      setProgress(70);

      // If backend extracted text, use that
      if (response.extractedText) {
        text = response.extractedText;
      }

      // Persist resume in store
      const isResume = /\.(pdf|docx?|txt)$/i.test(file.name);
      if (isResume && text) {
        setResumeFile({ name: file.name, text, uploadedAt: new Date().toISOString() });
      }

      // Show agent processing phase
      if (response.agentResult) {
        setPhase("processing");
        setProgress(85);
        await new Promise((r) => setTimeout(r, 800)); // Brief visual delay
        setProgress(100);
        setAgentResult(response.agentResult);

        // Add notification and feed item
        const domainMap: Record<string, string> = { inbox: "/inbox", career: "/career", calendar: "/calendar", budget: "/budget" };
        addNotification({
          text: `${file.name} processed → ${response.agentResult.domain} (${response.agentResult.title})`,
          time: "Just now",
          unread: true,
        });
        addAgentFeedItem({
          text: response.agentResult.title + (response.agentResult.detail ? ` — ${response.agentResult.detail}` : ""),
          category: (["inbox", "career", "calendar", "budget"].includes(response.agentResult.domain)
            ? response.agentResult.domain
            : "inbox") as "inbox" | "career" | "calendar" | "budget",
          actionLabel: `View in ${response.agentResult.domain}`,
          actionUrl: domainMap[response.agentResult.domain] || "/dashboard",
          timestamp: new Date().toISOString(),
          domain: response.agentResult.domain,
          priority: response.agentResult.priority,
        });
      } else {
        setProgress(100);
      }

      setPhase("done");
      addToast({ message: `"${file.name}" uploaded and processed!`, type: "success" });
    } catch {
      clearInterval(progressInterval);

      // Fallback: try to process text content directly if upload fails
      try {
        const text = await file.text();
        if (text.length > 10) {
          setPhase("processing");
          setProgress(75);
          const result = await processContent(text);
          setProgress(100);
          setAgentResult(result);
          setPhase("done");
          addToast({ message: `"${file.name}" processed via text extraction!`, type: "success" });

          const domainMap2: Record<string, string> = { inbox: "/inbox", career: "/career", calendar: "/calendar", budget: "/budget" };
          addNotification({
            text: `${file.name} processed → ${result.domain} (${result.title})`,
            time: "Just now",
            unread: true,
          });
          addAgentFeedItem({
            text: result.title + (result.detail ? ` — ${result.detail}` : ""),
            category: (["inbox", "career", "calendar", "budget"].includes(result.domain)
              ? result.domain
              : "inbox") as "inbox" | "career" | "calendar" | "budget",
            actionLabel: `View in ${result.domain}`,
            actionUrl: domainMap2[result.domain] || "/dashboard",
            timestamp: new Date().toISOString(),
            domain: result.domain,
            priority: result.priority,
          });
          return;
        }
      } catch { /* ignore fallback failure */ }

      setPhase("idle");
      setProgress(0);
      addToast({ message: `Failed to process "${file.name}". Try again.`, type: "error" });
    }
  }, [addToast, setResumeFile, addNotification]);

  const resetUpload = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setAgentResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragging
            ? "border-primary bg-primary/5 upload-glow"
            : phase === "done" && agentResult
              ? "border-success bg-success/5"
              : phase === "processing"
                ? "border-purple-400 bg-purple-50"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
          }
        `}
      >
        {phase === "idle" && (
          <input
            type="file"
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            accept=".pdf,.doc,.docx,.txt,.csv,.eml"
          />
        )}

        <div className="flex flex-col items-center justify-center py-10 px-6">
          <AnimatePresence mode="wait">
            {phase === "done" && agentResult ? (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="mb-3"
              >
                <CheckCircleIcon className="w-12 h-12 text-success" />
              </motion.div>
            ) : phase === "processing" ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-3"
              >
                <CpuChipIcon className="w-12 h-12 text-purple-500 animate-pulse" />
              </motion.div>
            ) : phase === "uploading" ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-3"
              >
                <DocumentIcon className="w-12 h-12 text-primary animate-pulse" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, -4, 0] }}
                transition={{ y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
                exit={{ opacity: 0 }}
                className="mb-3"
              >
                <CloudArrowUpIcon className="w-12 h-12 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "uploading" || phase === "processing" ? (
            <div className="w-full max-w-xs">
              <p className="text-sm font-medium text-text-primary mb-1 text-center">{fileName}</p>
              <p className="text-xs text-text-secondary mb-2 text-center">
                {phase === "processing" ? "Running through AI agent pipeline..." : "Uploading & extracting text..."}
              </p>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${phase === "processing" ? "bg-purple-500" : "bg-primary"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-1 text-center">{progress}%</p>
              {phase === "processing" && (
                <p className="text-xs text-purple-600 mt-2 text-center font-medium">
                  Router → Extractor → Planner → Review → Action → Memory
                </p>
              )}
            </div>
          ) : phase === "done" && agentResult ? (
            <div className="text-center">
              <p className="text-sm font-medium text-success">Processed by {agentResult.domain} agent!</p>
              <button
                onClick={resetUpload}
                className="text-xs text-primary hover:underline mt-2"
              >
                Upload another file
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-text-primary mb-1">
                Upload anything — AI agents will handle it
              </p>
              <p className="text-xs text-text-secondary">
                Drop resumes, emails, receipts, syllabi, or job descriptions
              </p>
              {resumeFile && (
                <p className="text-xs text-primary mt-2">
                  Current resume: {resumeFile.name}
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Agent Result Panel */}
      {agentResult && (
        <AgentResultPanel
          result={agentResult}
          fileName={fileName}
          onClose={resetUpload}
          onApprove={agentResult.requiresApproval ? () => {
            addToast({ message: "Action approved!", type: "success" });
            resetUpload();
          } : undefined}
        />
      )}
    </div>
  );
}
