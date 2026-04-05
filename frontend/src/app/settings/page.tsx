"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
        enabled ? "bg-primary" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const gmailConnected = useAppStore((s) => s.gmailConnected);
  const addToast = useAppStore((s) => s.addToast);

  // Mock notification toggles
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);

  const handleExportData = () => {
    addToast({ message: "Preparing your data export...", type: "info" });
  };

  const handleDeleteAccount = () => {
    addToast({
      message: "Account deletion requires email confirmation.",
      type: "warning",
    });
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Customize your SparkUp experience
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Appearance */}
          <motion.div variants={item}>
            <Card>
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Appearance
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    {theme === "light" ? (
                      <SunIcon className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <MoonIcon className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Theme
                    </p>
                    <p className="text-xs text-text-secondary">
                      Currently using{" "}
                      {theme === "light" ? "light" : "dark"} mode
                    </p>
                  </div>
                </div>
                <Toggle
                  enabled={theme === "dark"}
                  onToggle={toggleTheme}
                />
              </div>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={item}>
            <Card>
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Email Notifications
                      </p>
                      <p className="text-xs text-text-secondary">
                        Receive updates via email
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={emailNotifs}
                    onToggle={() => setEmailNotifs(!emailNotifs)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <DevicePhoneMobileIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Push Notifications
                      </p>
                      <p className="text-xs text-text-secondary">
                        Browser push notifications
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={pushNotifs}
                    onToggle={() => setPushNotifs(!pushNotifs)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Budget Alerts
                      </p>
                      <p className="text-xs text-text-secondary">
                        Get notified when spending exceeds limits
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={budgetAlerts}
                    onToggle={() => setBudgetAlerts(!budgetAlerts)}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Connected Accounts */}
          <motion.div variants={item}>
            <Card>
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Connected Accounts
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <EnvelopeIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Gmail
                    </p>
                    <p className="text-xs text-text-secondary">
                      {gmailConnected
                        ? "Your Gmail account is connected"
                        : "Connect your Gmail to sync emails"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={gmailConnected ? "success" : "default"}>
                    {gmailConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  {!gmailConnected && (
                    <Button variant="secondary" size="sm">
                      Connect with Google
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Data & Privacy */}
          <motion.div variants={item}>
            <Card>
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Data &amp; Privacy
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Export My Data
                      </p>
                      <p className="text-xs text-text-secondary">
                        Download a copy of all your data
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportData}
                    icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Delete Account
                      </p>
                      <p className="text-xs text-text-secondary">
                        Permanently remove your account and data
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteAccount}
                    icon={<TrashIcon className="w-4 h-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </AppShell>
  );
}
