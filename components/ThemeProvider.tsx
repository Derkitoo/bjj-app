"use client";

import { useEffect } from "react";
import { applyTheme, type ThemeKey } from "@/lib/themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeKey) || "rouge";
    applyTheme(saved);
  }, []);

  return <>{children}</>;
}
