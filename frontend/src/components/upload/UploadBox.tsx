"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudArrowUpIcon, CheckCircleIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";

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

    // Simulate upload progress
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
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        accept=".pdf,.doc,.docx,.txt,.csv,.eml"
      />

      <div className="flex flex-col items-center justify-center py-10 px-6">
        <AnimatePresence mode="wait">
          {uploaded ? (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="mb-3"
            >
              <CheckCircleIcon className="w-12 h-12 text-success" />
            </motion.div>
          ) : uploading ? (
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

        {uploading ? (
          <div className="w-full max-w-xs">
            <p className="text-sm font-medium text-text-primary mb-2 text-center">{fileName}</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1 text-center">{progress}%</p>
          </div>
        ) : uploaded ? (
          <p className="text-sm font-medium text-success">Upload complete!</p>
        ) : (
          <>
            <p className="text-sm font-medium text-text-primary mb-1">
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
