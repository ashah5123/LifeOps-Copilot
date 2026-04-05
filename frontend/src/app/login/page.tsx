"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SparklesIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";
import { authLogin, authMe, getGoogleLoginUrl } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, addToast, clearAuthSession } = useAppStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw =
          typeof window !== "undefined"
            ? localStorage.getItem("lifeops-state") || localStorage.getItem("sparkup-state")
            : null;
        if (!raw) return;
        const s = JSON.parse(raw) as { authToken?: string | null; isAuthenticated?: boolean };
        if (!s.authToken || !s.isAuthenticated) return;
        const me = await authMe();
        if (cancelled) return;
        const displayName =
          me.name?.trim() ||
          me.email.split("@")[0].charAt(0).toUpperCase() + me.email.split("@")[0].slice(1);
        const initials = (me.name || me.email)
          .split(/\s+/)
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        login(
          {
            name: displayName,
            email: me.email,
            initials: initials || displayName.slice(0, 2).toUpperCase(),
          },
          true,
          s.authToken ?? null,
        );
        router.replace("/dashboard");
      } catch {
        clearAuthSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearAuthSession, login, router]);

  // Handle Google OAuth callback (backend redirects here with ?google_token=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    // Google OAuth auto-login
    const googleToken = params.get("google_token");
    if (googleToken) {
      const name = params.get("name") || "";
      const googleEmail = params.get("email") || "";
      const displayName = name || googleEmail.split("@")[0];
      const initials = displayName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      login(
        { name: displayName, email: googleEmail, initials: initials || displayName.slice(0, 2).toUpperCase() },
        true,
        googleToken,
      );
      addToast({ message: `Welcome, ${displayName}!`, type: "success" });
      window.history.replaceState({}, "", "/login");
      router.replace("/dashboard");
      return;
    }

    // OAuth error from backend
    const oauthError = params.get("error");
    if (oauthError) {
      setError("Google sign-in failed. Please try again.");
      addToast({ message: "Google sign-in failed", type: "error" });
      window.history.replaceState({}, "", "/login");
      return;
    }

    // Gmail linked notification
    if (params.get("gmail") === "connected") {
      addToast({
        message: "Gmail linked! You can now use Inbox.",
        type: "success",
      });
      window.history.replaceState({}, "", "/login");
    }
  }, [addToast, login, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await authLogin({ email: email.trim(), password });
      const displayName =
        res.user.name?.trim() ||
        res.user.email.split("@")[0].charAt(0).toUpperCase() + res.user.email.split("@")[0].slice(1);
      const initials = (res.user.name || res.user.email)
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      login(
        { name: displayName, email: res.user.email, initials: initials || displayName.slice(0, 2).toUpperCase() },
        rememberMe,
        res.token,
      );
      addToast({ message: `Welcome back, ${displayName}!`, type: "success" });
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    try {
      const { authUrl } = await getGoogleLoginUrl();
      if (!authUrl?.startsWith("http")) {
        throw new Error("Invalid auth URL from server");
      }
      window.location.assign(authUrl);
    } catch {
      setError("Could not start Google sign-in. Please try again.");
      addToast({ message: "Google sign-in unavailable", type: "error" });
    }
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
            <span className="text-3xl font-bold tracking-tight">LifeOps Copilot</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Your AI-powered student life assistant
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Manage your inbox, career, calendar, and budget — all in one place with intelligent automation.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Emails to reply", value: "4" },
              { label: "Deadlines", value: "2" },
              { label: "Tasks today", value: "6" },
              { label: "Budget alerts", value: "1" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/60">{stat.label}</p>
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
            <span className="text-2xl font-bold text-text-primary">LifeOps Copilot</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Log in to LifeOps Copilot</h2>
          <p className="text-sm text-text-secondary mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary-hover font-medium">
              Sign up
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-xs text-text-secondary">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-hover font-medium">
                Forgot password?
              </Link>
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
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </motion.button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-text-secondary">or continue with</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => void handleGoogle()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-text-primary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
