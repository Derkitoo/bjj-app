"use client";

import { useEffect } from "react";
import { applyTheme, applyDarkMode, type ThemeKey } from "@/lib/themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const theme = (localStorage.getItem("theme") as ThemeKey) || "rouge";
    const dark = localStorage.getItem("darkMode") === "1";
    applyTheme(theme);
    applyDarkMode(dark);
  }, []);

  return <>{children}</>;
}
