"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function ThemeInit() {
  const initTheme = useAppStore((s) => s.initTheme);
  useEffect(() => { initTheme(); }, [initTheme]);
  return null;
}
