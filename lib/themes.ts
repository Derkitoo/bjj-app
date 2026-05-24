export const THEMES = {
  rouge:   { label: "Rouge",       primary: "#cc0000", dark: "#aa0000", subtle: "rgba(204,0,0,0.12)",    bg: "#fef2f2", sidebar: "#1a1a1a" },
  bleu:    { label: "Bleu Marine", primary: "#1d4ed8", dark: "#1e3a8a", subtle: "rgba(29,78,216,0.12)",  bg: "#eff6ff", sidebar: "#0f172a" },
  vert:    { label: "Vert",        primary: "#16a34a", dark: "#15803d", subtle: "rgba(22,163,74,0.12)",  bg: "#f0fdf4", sidebar: "#14532d" },
  violet:  { label: "Violet",      primary: "#7c3aed", dark: "#6d28d9", subtle: "rgba(124,58,237,0.12)", bg: "#f5f3ff", sidebar: "#1e1b4b" },
  ardoise: { label: "Ardoise",     primary: "#475569", dark: "#334155", subtle: "rgba(71,85,105,0.12)",  bg: "#f8fafc", sidebar: "#1e293b" },
} as const;

export type ThemeKey = keyof typeof THEMES;

export const applyTheme = (key: ThemeKey) => {
  const t = THEMES[key];
  const r = document.documentElement;
  r.style.setProperty("--color-primary", t.primary);
  r.style.setProperty("--color-primary-dark", t.dark);
  r.style.setProperty("--color-primary-subtle", t.subtle);
  r.style.setProperty("--color-primary-bg", t.bg);
  r.style.setProperty("--color-sidebar", t.sidebar);
};
