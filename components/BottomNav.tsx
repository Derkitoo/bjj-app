"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  Award,
  Newspaper,
  Home,
  User,
} from "lucide-react";

interface BottomNavProps {
  role: "ADMIN" | "ELEVE";
}

const adminLinks = [
  { href: "/admin/dashboard", label: "Tableau", icon: LayoutDashboard },
  { href: "/admin/eleves", label: "Élèves", icon: Users },
  { href: "/admin/presence", label: "Présence", icon: CheckSquare },
  { href: "/admin/planning", label: "Planning", icon: Calendar },
  { href: "/admin/ceintures", label: "Ceintures", icon: Award },
];

const eleveLinks = [
  { href: "/eleve/accueil", label: "Accueil", icon: Home },
  { href: "/eleve/planning", label: "Planning", icon: Calendar },
  { href: "/eleve/actualites", label: "Actualités", icon: Newspaper },
  { href: "/eleve/profil", label: "Profil", icon: User },
];

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? adminLinks : eleveLinks;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 z-50"
      style={{ backgroundColor: "var(--color-sidebar)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? "text-[var(--color-primary)]" : "text-white/60"
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
