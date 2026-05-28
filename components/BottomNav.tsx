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
  CreditCard,
  UserCog,
  ClipboardList,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface BottomNavProps {
  role: "ADMIN" | "PROF" | "ELEVE";
}

const ALL_ADMIN_LINKS = [
  { key: "dashboard",  href: "/admin/dashboard",  label: "Tableau",    icon: LayoutDashboard },
  { key: "eleves",     href: "/admin/eleves",     label: "Élèves",     icon: Users },
  { key: "presence",   href: "/admin/presence",   label: "Présence",   icon: CheckSquare },
  { key: "planning",   href: "/admin/planning",   label: "Planning",   icon: Calendar },
  { key: "ceintures",  href: "/admin/ceintures",  label: "Ceintures",  icon: Award },
  { key: "actualites", href: "/admin/actualites", label: "Actualités", icon: Newspaper },
  { key: "paiements",  href: "/admin/paiements",  label: "Paiements",  icon: CreditCard },
  { key: "comptes",    href: "/admin/comptes",    label: "Comptes",    icon: UserCog },
];

const eleveLinks = [
  { key: "accueil",    href: "/eleve/accueil",    label: "Accueil",    icon: Home },
  { key: "planning",   href: "/eleve/planning",   label: "Planning",   icon: Calendar },
  { key: "actualites", href: "/eleve/actualites", label: "Actualités", icon: Newspaper },
  { key: "examens",    href: "/eleve/examens",    label: "Examens",    icon: ClipboardList },
  { key: "profil",     href: "/eleve/profil",     label: "Profil",     icon: User },
];

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  let links: typeof ALL_ADMIN_LINKS;
  if (role === "ELEVE") {
    links = eleveLinks;
  } else if (role === "ADMIN") {
    links = ALL_ADMIN_LINKS.slice(0, 5);
  } else {
    const permissionsRaw = (session?.user as { permissions?: string })?.permissions ?? "[]";
    let permissions: string[] = [];
    try { permissions = JSON.parse(permissionsRaw); } catch { permissions = []; }
    links = ALL_ADMIN_LINKS.filter((l) => permissions.includes(l.key)).slice(0, 5);
  }

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
