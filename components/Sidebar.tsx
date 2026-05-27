"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, CheckSquare, Calendar, Award,
  Newspaper, LogOut, Home, User, UserCog, CreditCard,
  Palette, Sun, Moon,
} from "lucide-react";
import { THEMES, applyTheme, applyDarkMode, type ThemeKey } from "@/lib/themes";

interface SidebarProps {
  role: "ADMIN" | "PROF" | "ELEVE";
}

const adminLinks = [
  { href: "/admin/dashboard",  label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/eleves",     label: "Élèves",           icon: Users },
  { href: "/admin/presence",   label: "Présence",         icon: CheckSquare },
  { href: "/admin/planning",   label: "Planning",         icon: Calendar },
  { href: "/admin/ceintures",  label: "Ceintures",        icon: Award },
  { href: "/admin/actualites", label: "Actualités",       icon: Newspaper },
  { href: "/admin/paiements",  label: "Paiements",        icon: CreditCard },
  { href: "/admin/comptes",    label: "Comptes",          icon: UserCog },
];

const profLinks = [
  { href: "/admin/presence",   label: "Présence",   icon: CheckSquare },
  { href: "/admin/planning",   label: "Planning",   icon: Calendar },
  { href: "/admin/eleves",     label: "Élèves",     icon: Users },
  { href: "/admin/actualites", label: "Actualités", icon: Newspaper },
];

const eleveLinks = [
  { href: "/eleve/accueil",    label: "Accueil",     icon: Home },
  { href: "/eleve/planning",   label: "Planning",    icon: Calendar },
  { href: "/eleve/actualites", label: "Actualités",  icon: Newspaper },
  { href: "/eleve/profil",     label: "Mon profil",  icon: User },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? adminLinks : role === "PROF" ? profLinks : eleveLinks;
  const [theme, setTheme] = useState<ThemeKey>("rouge");
  const [dark, setDark] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as ThemeKey) || "rouge";
    const savedDark = localStorage.getItem("darkMode") === "1";
    setTheme(savedTheme);
    setDark(savedDark);
  }, []);

  const selectTheme = (key: ThemeKey) => {
    localStorage.setItem("theme", key);
    applyTheme(key);
    setTheme(key);
  };

  const toggleDark = () => {
    const next = !dark;
    localStorage.setItem("darkMode", next ? "1" : "0");
    applyDarkMode(next);
    setDark(next);
  };

  return (
    <aside
      className="hidden md:flex flex-col w-60 min-h-screen fixed left-0 top-0 transition-colors duration-200"
      style={{ backgroundColor: "var(--color-sidebar)" }}
    >
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🥋</span>
          <span className="text-white font-bold text-lg">BJJ Manager</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm transition-colors ${
                active
                  ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? "Mode clair" : "Mode sombre"}
        </button>

        {/* Theme selector */}
        {(role === "ADMIN" || role === "PROF") && (
          <div>
            <button
              onClick={() => setShowThemes((v) => !v)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full"
            >
              <Palette size={18} />
              Thème
            </button>
            {showThemes && (
              <div className="px-3 pt-1 pb-2 flex items-center gap-2 flex-wrap">
                {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
                  <button
                    key={key}
                    title={t.label}
                    onClick={() => selectTheme(key)}
                    className="w-6 h-6 rounded-full transition-all"
                    style={{
                      backgroundColor: t.primary,
                      outline: theme === key ? "2px solid white" : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
