"use client";

import { motion } from "framer-motion";
import {
  UserCircleIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const quickStats = [
  {
    label: "Total Applications",
    value: 5,
    icon: BriefcaseIcon,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    label: "Emails Replied",
    value: 12,
    icon: ChatBubbleLeftRightIcon,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    label: "Budget Tracked",
    value: "$650",
    icon: BanknotesIcon,
    color: "text-green-600",
    bg: "bg-green-100",
  },
];

export default function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const resumeFile = useAppStore((s) => s.resumeFile);
  const gmailConnected = useAppStore((s) => s.gmailConnected);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            Profile
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your account information
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* User Info Card */}
          <motion.div variants={item}>
            <Card padding="lg">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">
                    {user?.initials || "??"}
                  </span>
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-text-primary truncate">
                    {user?.name || "Guest User"}
                  </h2>
                  <p className="text-sm text-text-secondary truncate">
                    {user?.email || "No email set"}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Member since January 2026
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Resume & Gmail Status */}
          <motion.div variants={item}>
            <Card>
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Account Status
              </h3>
              <div className="space-y-4">
                {/* Resume */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <DocumentTextIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Resume
                      </p>
                      {resumeFile ? (
                        <p className="text-xs text-text-secondary">
                          {resumeFile.name} &middot; Uploaded{" "}
                          {new Date(resumeFile.uploadedAt).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-xs text-text-secondary">
                          No resume uploaded
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={resumeFile ? "success" : "warning"}>
                    {resumeFile ? "Uploaded" : "Missing"}
                  </Badge>
                </div>

                {/* Gmail */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Gmail
                      </p>
                      <p className="text-xs text-text-secondary">
                        {gmailConnected
                          ? "Connected and syncing"
                          : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={gmailConnected ? "success" : "default"}>
                    {gmailConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={item}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Quick Stats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickStats.map((stat) => (
                <Card key={stat.label} hover padding="md">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                    >
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">
                        {stat.value}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppShell>
  );
}
