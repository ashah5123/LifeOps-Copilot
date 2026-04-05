"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SparklesIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    // Simulate signup
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    addToast({ message: "Account created! Please log in.", type: "success" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sidebar to-primary/90 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md text-white"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">SparkUp</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Your AI-powered student productivity platform
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Manage your inbox, career applications, calendar, and budget — all in one place with intelligent AI assistance.
          </p>
          <div className="mt-10 space-y-4">
            {["Smart inbox with AI replies", "Career tracking & insights", "Calendar with AI scheduling", "Budget alerts & analytics"].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                <span className="text-sm text-white/80">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-text-primary">SparkUp</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Create your account</h2>
          <p className="text-sm text-text-secondary mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vidhi Patel"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vidhi@university.edu"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 pr-10 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-error bg-red-50 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <p className="text-xs text-text-secondary text-center mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
