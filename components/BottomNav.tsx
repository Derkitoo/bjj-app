"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, CheckSquare, Calendar, Award,
  Newspaper, Home, User, CreditCard, UserCog,
  ClipboardList, BookOpen, MoreHorizontal, X,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface BottomNavProps {
  role: "ADMIN" | "PROF" | "ELEVE";
}

const ALL_ADMIN_LINKS = [
  { key: "dashboard",  href: "/admin/dashboard",  label: "Tableau",    icon: LayoutDashboard },
  { key: "eleves",     href: "/admin/eleves",     label: "Élèves",     icon: Users },
  { key: "examens",    href: "/admin/examens",    label: "Examens",    icon: ClipboardList },
  { key: "presence",   href: "/admin/presence",   label: "Présence",   icon: CheckSquare },
  { key: "planning",   href: "/admin/planning",   label: "Planning",   icon: Calendar },
  { key: "cours",      href: "/admin/cours",      label: "Cours",      icon: BookOpen },
  { key: "ceintures",  href: "/admin/ceintures",  label: "Ceintures",  icon: Award },
  { key: "actualites", href: "/admin/actualites", label: "Actualités", icon: Newspaper },
  { key: "paiements",  href: "/admin/paiements",  label: "Paiements",  icon: CreditCard },
  { key: "comptes",    href: "/admin/comptes",    label: "Comptes",    icon: UserCog },
];

const ELEVE_LINKS = [
  { key: "accueil",    href: "/eleve/accueil",    label: "Accueil",    icon: Home },
  { key: "planning",   href: "/eleve/planning",   label: "Planning",   icon: Calendar },
  { key: "cours",      href: "/eleve/cours",      label: "Techniques", icon: BookOpen },
  { key: "examens",    href: "/eleve/examens",    label: "Examens",    icon: ClipboardList },
  { key: "profil",     href: "/eleve/profil",     label: "Profil",     icon: User },
];

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showMore, setShowMore] = useState(false);

  let allLinks: typeof ALL_ADMIN_LINKS;
  if (role === "ELEVE") {
    allLinks = ELEVE_LINKS;
  } else if (role === "ADMIN") {
    allLinks = ALL_ADMIN_LINKS;
  } else {
    const permissionsRaw = (session?.user as { permissions?: string })?.permissions ?? "[]";
    let permissions: string[] = [];
    try { permissions = JSON.parse(permissionsRaw); } catch { permissions = []; }
    allLinks = ALL_ADMIN_LINKS.filter((l) => permissions.includes(l.key));
  }

  const primaryLinks = allLinks.slice(0, 4);
  const moreLinks = allLinks.slice(4);
  const hasMore = moreLinks.length > 0;

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-[64px] left-0 right-0 rounded-t-[20px] shadow-2xl p-4 pb-2"
            style={{ backgroundColor: "var(--color-sidebar)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Navigation
              </span>
              <button onClick={() => setShowMore(false)}>
                <X size={18} className="text-white/60" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-[12px] transition-colors ${
                      active ? "bg-[var(--color-primary-subtle)]" : "hover:bg-white/8"
                    }`}>
                    <Icon size={22} className={active ? "text-[var(--color-primary)]" : "text-white/70"} />
                    <span className={`text-[10px] font-medium ${active ? "text-[var(--color-primary)]" : "text-white/60"}`}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 z-50"
        style={{ backgroundColor: "var(--color-sidebar)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {primaryLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                  active ? "text-[var(--color-primary)]" : "text-white/55"
                }`}>
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
          {hasMore && (
            <button
              onClick={() => setShowMore((v) => !v)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                showMore ? "text-[var(--color-primary)]" : "text-white/55"
              }`}>
              <MoreHorizontal size={20} />
              <span>Plus</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
