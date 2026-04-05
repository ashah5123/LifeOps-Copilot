"use client";

import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
<<<<<<< HEAD
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
=======
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
<<<<<<< HEAD
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                  <XMarkIcon className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
              <div className="px-6 py-5">{children}</div>
            </div>
          </motion.div>
=======
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`bg-surface rounded-2xl shadow-xl w-full ${maxWidth} max-h-[85vh] overflow-hidden`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-130px)]">
                {children}
              </div>
            </motion.div>
          </div>
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
        </>
      )}
    </AnimatePresence>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 7a240aea4d846856099e35e71a9d933d3f616372
