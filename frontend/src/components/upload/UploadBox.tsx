"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";

function LiveUploadIcon() {
  return (
    <div className="relative mb-3 flex h-20 w-20 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/25"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border border-violet-400/30"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-violet-500/20 shadow-lg shadow-primary/15 ring-1 ring-primary/25"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-primary" fill="none" aria-hidden>
          <motion.path
            d="M12 4v12M12 4l4 4M12 4L8 8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4 }}
          />
          <motion.path
            d="M8 16h8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            opacity={0.6}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </svg>
      </motion.div>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary/60"
          style={{ left: `${30 + i * 18}%`, top: `${65 + i * 5}%` }}
          animate={{ y: [0, -14 - i * 4, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 2 + i * 0.2, repeat: Infinity, delay: i * 0.25, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function UploadBox() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const addToast = useAppStore((s) => s.addToast);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    setUploaded(false);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 150));
      setProgress(i);
    }

    setUploading(false);
    setUploaded(true);
    addToast({ message: `"${file.name}" uploaded successfully!`, type: "success" });

    setTimeout(() => {
      setUploaded(false);
      setFileName("");
      setProgress(0);
    }, 3000);
  }, [addToast]);

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
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
        ${isDragging
          ? "border-primary bg-primary/5 upload-glow"
          : uploaded
            ? "border-success bg-success/5"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        }
      `}
    >
      <input
        type="file"
        onChange={handleChange}
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        accept=".pdf,.doc,.docx,.txt,.csv,.eml"
      />

      <div className="flex flex-col items-center justify-center px-6 py-10">
        <AnimatePresence mode="wait">
          {uploaded ? (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="mb-3"
            >
              <CheckCircleIcon className="h-12 w-12 text-success" />
            </motion.div>
          ) : uploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-3"
            >
              <DocumentIcon className="h-12 w-12 animate-pulse text-primary" />
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LiveUploadIcon />
            </motion.div>
          )}
        </AnimatePresence>

        {uploading ? (
          <div className="w-full max-w-xs">
            <p className="mb-2 text-center text-sm font-medium text-text-primary">{fileName}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-text-secondary">{progress}%</p>
          </div>
        ) : uploaded ? (
          <p className="text-sm font-medium text-success">Upload complete!</p>
        ) : (
          <>
            <p className="mb-1 text-sm font-medium text-text-primary">
              Upload resume, emails, or docs
            </p>
            <p className="text-xs text-text-secondary">
              Drag & drop or click to browse
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
