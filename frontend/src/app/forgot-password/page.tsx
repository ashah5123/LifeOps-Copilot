"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { authForgotPassword, authResetPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await authForgotPassword(email.trim());
      if (res.token) {
        setToken(res.token);
        setStep("reset");
      } else {
        setError("No account found with that email address.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authResetPassword({ email: email.trim(), token, new_password: newPassword });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-text-primary">LifeOps Copilot</span>
        </div>

        {step === "email" && (
          <>
            <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">
              Reset your password
            </h2>
            <p className="text-sm text-text-secondary mb-8 text-center">
              Enter your email and we&apos;ll help you reset your password.
            </p>
            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
              {error && (
                <p className="text-sm text-error bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Sending..." : "Continue"}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">
              Set a new password
            </h2>
            <p className="text-sm text-text-secondary mb-8 text-center">
              Enter your new password below.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
              {error && (
                <p className="text-sm text-error bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Password Reset!</h2>
            <p className="text-sm text-text-secondary mb-6">
              Your password has been updated. You can now log in with your new password.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Back to Log In
            </button>
          </div>
        )}

        <p className="text-center mt-6 text-sm text-text-secondary">
          <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
            Back to Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
