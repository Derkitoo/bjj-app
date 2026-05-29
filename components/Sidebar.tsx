"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, CheckSquare, Calendar, Award,
  Newspaper, LogOut, Home, User, UserCog, CreditCard,
  Palette, Sun, Moon, ClipboardList, BookOpen, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { THEMES, applyTheme, applyDarkMode, type ThemeKey } from "@/lib/themes";

interface SidebarProps {
  role: "ADMIN" | "PROF" | "ELEVE";
}

const ADMIN_GROUPS = [
  {
    label: null,
    links: [{ key: "dashboard", href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    label: "Académie",
    links: [
      { key: "eleves",    href: "/admin/eleves",    label: "Élèves",    icon: Users },
      { key: "examens",   href: "/admin/examens",   label: "Examens",   icon: ClipboardList },
      { key: "presence",  href: "/admin/presence",  label: "Présence",  icon: CheckSquare },
      { key: "ceintures", href: "/admin/ceintures", label: "Ceintures", icon: Award },
    ],
  },
  {
    label: "Contenu",
    links: [
      { key: "planning",   href: "/admin/planning",   label: "Planning",    icon: Calendar },
      { key: "cours",      href: "/admin/cours",      label: "Cours",       icon: BookOpen },
      { key: "actualites", href: "/admin/actualites", label: "Actualités",  icon: Newspaper },
    ],
  },
  {
    label: "Gestion",
    links: [
      { key: "paiements", href: "/admin/paiements", label: "Paiements", icon: CreditCard },
      { key: "comptes",   href: "/admin/comptes",   label: "Comptes",   icon: UserCog },
    ],
  },
];

const ELEVE_LINKS = [
  { key: "accueil",    href: "/eleve/accueil",    label: "Accueil",      icon: Home },
  { key: "planning",   href: "/eleve/planning",   label: "Planning",     icon: Calendar },
  { key: "cours",      href: "/eleve/cours",      label: "Techniques",   icon: BookOpen },
  { key: "actualites", href: "/eleve/actualites", label: "Actualités",   icon: Newspaper },
  { key: "examens",    href: "/eleve/examens",    label: "Mes examens",  icon: ClipboardList },
  { key: "profil",     href: "/eleve/profil",     label: "Mon profil",   icon: User },
];

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrateur", PROF: "Professeur", ELEVE: "Élève" };

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeKey>("rouge");
  const [dark, setDark] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as ThemeKey) || "rouge";
    const savedDark = localStorage.getItem("darkMode") === "1";
    const savedCollapsed = localStorage.getItem("sidebarCollapsed") === "1";
    setTheme(savedTheme);
    setDark(savedDark);
    setCollapsed(savedCollapsed);
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

  const toggleCollapsed = () => {
    const next = !collapsed;
    localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
    setCollapsed(next);
  };

  const userName = session?.user?.name ?? "";
  const userRole = (session?.user as { role?: string })?.role ?? role;

  let groups: typeof ADMIN_GROUPS;
  if (role === "ELEVE") {
    groups = [{ label: null, links: ELEVE_LINKS }];
  } else if (role === "ADMIN") {
    groups = ADMIN_GROUPS;
  } else {
    const permissionsRaw = (session?.user as { permissions?: string })?.permissions ?? "[]";
    let permissions: string[] = [];
    try { permissions = JSON.parse(permissionsRaw); } catch { permissions = []; }
    groups = ADMIN_GROUPS.map((g) => ({
      ...g,
      links: g.links.filter((l) => permissions.includes(l.key)),
    })).filter((g) => g.links.length > 0);
  }

  const w = collapsed ? "w-[68px]" : "w-64";

  return (
    <aside
      className={`hidden md:flex flex-col ${w} min-h-screen fixed left-0 top-0 transition-all duration-200 z-40`}
      style={{ backgroundColor: "var(--color-sidebar)" }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/10 h-16 ${collapsed ? "px-4 justify-center" : "px-5 gap-3"}`}>
        <span className="text-2xl flex-shrink-0">🥋</span>
        {!collapsed && <span className="text-white font-bold text-base tracking-tight">BJJ Manager</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-5">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5 select-none"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                {group.label}
              </p>
            )}
            {group.label && collapsed && <div className="h-px mx-2 mb-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />}
            <div className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 rounded-[8px] text-sm transition-colors ${
                      collapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2.5"
                    } ${
                      active
                        ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-medium"
                        : "text-white/65 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-2.5 py-3 space-y-0.5">
        <button
          onClick={toggleDark}
          title={dark ? "Mode clair" : "Mode sombre"}
          className={`flex items-center gap-3 rounded-[8px] text-sm text-white/65 hover:text-white hover:bg-white/8 transition-colors w-full ${
            collapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2"
          }`}
        >
          {dark ? <Sun size={17} className="flex-shrink-0" /> : <Moon size={17} className="flex-shrink-0" />}
          {!collapsed && <span>{dark ? "Mode clair" : "Mode sombre"}</span>}
        </button>

        {(role === "ADMIN" || role === "PROF") && (
          <div>
            <button
              onClick={() => setShowThemes((v) => !v)}
              title="Thème"
              className={`flex items-center gap-3 rounded-[8px] text-sm text-white/65 hover:text-white hover:bg-white/8 transition-colors w-full ${
                collapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2"
              }`}
            >
              <Palette size={17} className="flex-shrink-0" />
              {!collapsed && <span>Thème</span>}
            </button>
            {showThemes && (
              <div className={`flex items-center gap-2 flex-wrap py-2 ${collapsed ? "justify-center px-1" : "px-3"}`}>
                {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
                  <button
                    key={key}
                    title={t.label}
                    onClick={() => selectTheme(key)}
                    className="w-5 h-5 rounded-full transition-all"
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
          title="Déconnexion"
          className={`flex items-center gap-3 rounded-[8px] text-sm text-white/65 hover:text-white hover:bg-white/8 transition-colors w-full ${
            collapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2"
          }`}
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>

        {/* User info */}
        {!collapsed && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}>
              {getInitials(userName)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName || "—"}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{ROLE_LABELS[userRole] ?? userRole}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mt-2 flex justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}>
              {getInitials(userName)}
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center shadow-md border transition-colors"
        style={{ backgroundColor: "var(--color-sidebar)", borderColor: "rgba(255,255,255,0.2)" }}
        title={collapsed ? "Développer" : "Réduire"}
      >
        {collapsed
          ? <ChevronRight size={13} className="text-white/70" />
          : <ChevronLeft size={13} className="text-white/70" />
        }
      </button>
    </aside>
  );
}
