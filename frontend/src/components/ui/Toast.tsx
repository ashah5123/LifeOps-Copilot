"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAppStore, type Toast as ToastType } from "@/lib/store";

const icons = {
  success: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />,
  error: <ExclamationCircleIcon className="w-5 h-5 text-red-400" />,
  warning: <ExclamationCircleIcon className="w-5 h-5 text-amber-400" />,
  info: <InformationCircleIcon className="w-5 h-5 text-blue-400" />,
};

const bgColors = {
  success: "bg-surface border-emerald-500/30",
  error: "bg-surface border-red-500/30",
  warning: "bg-surface border-amber-500/30",
  info: "bg-surface border-blue-500/30",
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useAppStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl shadow-black/20 ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="text-sm text-text-primary flex-1">{toast.message}</p>
      <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-surface-hover rounded cursor-pointer">
        <XMarkIcon className="w-4 h-4 text-text-secondary" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
