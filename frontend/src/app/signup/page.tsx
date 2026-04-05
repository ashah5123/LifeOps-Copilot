"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SparklesIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAppStore } from "@/lib/store";
import { hasAccount, registerAccount } from "@/lib/local-accounts";
import { COUNTRIES, getRegionsForCountry } from "@/lib/country-states";
import NoiseBackground from "@/components/ui/NoiseBackground";
import TypingPlaceholderInput from "@/components/ui/TypingPlaceholderInput";

const inputClass = "w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

const selectClass = `${inputClass} cursor-pointer appearance-none bg-surface pr-10`;
const selectChevron =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")";

const NAME_PLACEHOLDERS = ["Nishit Patel", "Alex Rivera", "Samira Chen", "Jordan Lee"];
const EMAIL_PLACEHOLDERS = ["nishit@university.edu", "alex@asu.edu", "hello@lifeops.app", "you@university.edu"];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);

  const regions = useMemo(() => (country ? getRegionsForCountry(country) : []), [country]);
  const stateObj = regions.find((s) => s.value === selectedState);
  const derivedTimezone = stateObj?.tz || "UTC";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!country) {
      setError("Please select your country");
      return;
    }
    if (!selectedState) {
      setError("Please select your state or region");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const emailKey = email.toLowerCase().trim();
    if (typeof localStorage !== "undefined" && hasAccount(emailKey)) {
      const msg = "An account with this email already exists. Please log in.";
      setError(msg);
      addToast({ message: msg, type: "error" });
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    const trimmed = name.trim();
    const first = trimmed.split(/\s+/)[0] || trimmed;
    if (typeof localStorage !== "undefined") {
      registerAccount(emailKey, {
        password,
        name: trimmed,
        firstName: first,
        country,
        state: selectedState,
        timezone: derivedTimezone,
      });
      localStorage.setItem(
        `lifeops-profile-${emailKey}`,
        JSON.stringify({
          name: trimmed,
          firstName: first,
          country,
          state: selectedState,
          timezone: derivedTimezone,
        })
      );
    }
    addToast({ message: "Account created! Please log in.", type: "success" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sidebar to-primary/90 items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">LifeOps</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Your AI-powered student productivity platform</h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Manage your inbox, career applications, calendar, and budget — all in one place with intelligent AI assistance.
          </p>
          <div className="mt-10 space-y-4">
            {["Smart inbox with AI replies", "Career tracking & insights", "Calendar with AI scheduling", "Budget alerts & analytics"].map((feature, i) => (
              <motion.div key={feature} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                <span className="text-sm text-white/80">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-text-primary">LifeOps</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Create your account</h2>
          <p className="text-sm text-text-secondary mb-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary-hover font-medium">Log in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
              <TypingPlaceholderInput
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholders={NAME_PLACEHOLDERS}
                className={inputClass}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
              <TypingPlaceholderInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholders={EMAIL_PLACEHOLDERS}
                className={inputClass}
                autoComplete="email"
              />
            </div>

            {/* Country + State/region */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Country</label>
                <select
                  required
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setSelectedState("");
                  }}
                  className={selectClass}
                  style={{
                    backgroundImage: selectChevron,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">State / Region</label>
                <select
                  required
                  disabled={!country}
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-50`}
                  style={{
                    backgroundImage: selectChevron,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  <option value="">{country ? "Select state / region" : "Select country first"}</option>
                  {regions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Show derived timezone */}
            {selectedState && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/15 rounded-lg">
                <span className="text-xs text-text-secondary">Timezone:</span>
                <span className="text-xs text-primary font-medium">{derivedTimezone.replace(/_/g, " ")}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
                  className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer">
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm Password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className={inputClass} />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg border border-error/20">
                {error}
              </motion.p>
            )}

            <NoiseBackground
              containerClassName="w-full rounded-xl"
              gradientColors={["rgb(94, 106, 210)", "rgb(124, 133, 224)", "rgb(245, 165, 36)"]}
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-neutral-100 via-neutral-100 to-white px-4 py-2.5 text-sm font-medium text-black shadow-[0px_2px_0px_0px_var(--color-neutral-50)_inset,0px_0.5px_1px_0px_var(--color-neutral-400)] transition-all duration-100 active:scale-[0.98] disabled:opacity-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 dark:text-white dark:shadow-[0px_1px_0px_0px_var(--color-neutral-950)_inset,0px_1px_0px_0px_var(--color-neutral-800)]"
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
                  "Create Account →"
                )}
              </motion.button>
            </NoiseBackground>
          </form>

          <p className="text-xs text-text-secondary text-center mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
