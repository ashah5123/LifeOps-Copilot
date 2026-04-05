"use client";

import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import LifeOpsKnowUs from "@/components/know-us/LifeOpsKnowUs";

export default function KnowUsPage() {
  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <LifeOpsKnowUs />
      </motion.div>
    </AppShell>
  );
}
