import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Users, CheckSquare, Award, Newspaper, TrendingUp, CreditCard } from "lucide-react";
import Link from "next/link";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

const CEINTURE_COLORS: Record<string, { bg: string; border?: string }> = {
  BLANCHE: { bg: "#f3f4f6", border: "#d1d5db" },
  BLEUE:   { bg: "#1d4ed8" },
  VIOLETTE:{ bg: "#7c3aed" },
  MARRON:  { bg: "#92400e" },
  NOIRE:   { bg: "#111111" },
};

export default async function DashboardPage() {
  await auth();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfCurrentMonth = startOfMonth(today);

  // Build 6-month window
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, 5 - i);
    return { label: format(d, "MMM", { locale: fr }), start: startOfMonth(d), end: endOfMonth(d) };
  });

  const [totalEleves, presencesAujourdhui, lastPost, criteres, eleves, paiementsImpayesCeMois] = await Promise.all([
    prisma.eleve.count({ where: { actif: true } }),
    prisma.presence.count({ where: { date: { gte: startOfDay } } }),
    prisma.post.findFirst({ where: { publie: true }, orderBy: { createdAt: "desc" } }),
    prisma.criterePromotion.findMany(),
    prisma.eleve.findMany({
      where: { actif: true },
      include: {
        presences: { where: { date: { gte: startOfCurrentMonth } } },
        promotions: { orderBy: { date: "desc" }, take: 1 },
      },
    }),
    prisma.paiement.count({
      where: { statut: { not: "PAYE" }, mois: today.getMonth() + 1, annee: today.getFullYear() },
    }),
  ]);

  // Presence counts per month
  const presencesParMois = await Promise.all(
    months.map((m) => prisma.presence.count({ where: { date: { gte: m.start, lte: m.end } } }))
  );
  const maxPresences = Math.max(...presencesParMois, 1);

  // Belt distribution
  const allEleves = await prisma.eleve.findMany({ where: { actif: true }, select: { ceinture: true } });
  const distrib: Record<string, number> = {};
  allEleves.forEach((e) => { distrib[e.ceinture] = (distrib[e.ceinture] ?? 0) + 1; });

  const NEXT: Record<string, string> = { BLANCHE: "BLEUE", BLEUE: "VIOLETTE", VIOLETTE: "MARRON", MARRON: "NOIRE" };
  const eligibles = eleves.filter((e) => {
    const nextBelt = NEXT[e.ceinture];
    if (!nextBelt) return false;
    const critere = criteres.find((c) => c.ceintureCible === nextBelt);
    if (!critere) return false;
    const lastPromo = e.promotions[0];
    const monthsSincePromo = lastPromo
      ? (today.getTime() - new Date(lastPromo.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      : 999;
    return e.presences.length >= critere.minCours && monthsSincePromo >= critere.minMois;
  });

  // Top 5 present this month
  const top5 = [...eleves]
    .sort((a, b) => b.presences.length - a.presences.length)
    .slice(0, 5)
    .filter((e) => e.presences.length > 0);

  // Retention: présents au moins 3 fois ce mois (proxy pour 3 semaines sur 4)
  const presencesMois = await prisma.presence.count({ where: { date: { gte: startOfCurrentMonth } } });
  const tauxPresence = totalEleves > 0 ? Math.round((presencesMois / (totalEleves * 4)) * 100) : 0;
  const nbFideles = eleves.filter((e) => e.presences.length >= 3).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Tableau de bord</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#666666] text-sm">Présents aujourd&apos;hui</span>
            <CheckSquare size={18} className="text-[#cc0000]" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{presencesAujourdhui}</p>
          <p className="text-xs text-[#666666] mt-1">sur {totalEleves} actifs</p>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#666666] text-sm">Élèves actifs</span>
            <Users size={18} className="text-[#cc0000]" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{totalEleves}</p>
          <Link href="/admin/eleves" className="text-xs text-[#cc0000] hover:underline mt-1 block">Voir la liste</Link>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#666666] text-sm">Taux présence (mois)</span>
            <TrendingUp size={18} className="text-[#cc0000]" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{tauxPresence}%</p>
          <p className="text-xs text-[#666666] mt-1">{nbFideles} fidèles (≥3/mois)</p>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#666666] text-sm">Impayés ce mois</span>
            <CreditCard size={18} className="text-[#cc0000]" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{paiementsImpayesCeMois}</p>
          <Link href="/admin/paiements" className="text-xs text-[#cc0000] hover:underline mt-1 block">Voir paiements</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Graphique présences 6 mois */}
        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Présences — 6 derniers mois</h2>
          <div className="flex items-end gap-2 h-32">
            {months.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-[#666666]">{presencesParMois[i]}</span>
                <div className="w-full bg-[#cc0000] rounded-t-[4px] transition-all"
                  style={{ height: `${Math.round((presencesParMois[i] / maxPresences) * 96)}px`, minHeight: presencesParMois[i] > 0 ? "4px" : "0" }} />
                <span className="text-xs text-[#666666] capitalize">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par ceinture */}
        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Répartition par ceinture</h2>
          <div className="space-y-3">
            {["BLANCHE", "BLEUE", "VIOLETTE", "MARRON", "NOIRE"].map((belt) => {
              const count = distrib[belt] ?? 0;
              const pct = totalEleves > 0 ? Math.round((count / totalEleves) * 100) : 0;
              return (
                <div key={belt} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CEINTURE_COLORS[belt].bg, border: CEINTURE_COLORS[belt].border ? `1px solid ${CEINTURE_COLORS[belt].border}` : undefined }} />
                  <span className="text-xs text-[#666666] w-16 capitalize">{belt.toLowerCase()}</span>
                  <div className="flex-1 bg-[#e5e5e5] rounded-full h-2">
                    <div className="bg-[#cc0000] h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-[#666666] w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top présences ce mois */}
        {top5.length > 0 && (
          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="font-semibold text-[#1a1a1a] mb-4">Top présences ce mois</h2>
            <ol className="space-y-2">
              {top5.map((e, i) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#cc0000] w-4">{i + 1}</span>
                  <span className="text-sm text-[#1a1a1a] flex-1">{e.prenom} {e.nom}</span>
                  <span className="text-xs font-semibold text-[#1a1a1a]">{e.presences.length} cours</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Éligibles à promotion */}
        {eligibles.length > 0 && (
          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
              <Award size={16} className="text-[#cc0000]" />
              Éligibles à promotion ({eligibles.length})
            </h2>
            <ul className="space-y-2">
              {eligibles.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#1a1a1a]">{e.prenom} {e.nom}</span>
                  <span className="text-xs text-[#cc0000] font-medium">→ {NEXT[e.ceinture]?.toLowerCase()}</span>
                </li>
              ))}
            </ul>
            <Link href="/admin/ceintures" className="text-xs text-[#cc0000] hover:underline mt-3 block">Voir tous →</Link>
          </div>
        )}

        {/* Dernière actualité */}
        {lastPost && (
          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
              <Newspaper size={16} className="text-[#cc0000]" />
              Dernière actualité
            </h2>
            <p className="text-sm font-medium text-[#1a1a1a]">{lastPost.titre}</p>
            <p className="text-xs text-[#666666] mt-1">
              {format(new Date(lastPost.createdAt), "d MMMM yyyy", { locale: fr })}
            </p>
            <p className="text-sm text-[#666666] mt-2 line-clamp-2">{lastPost.contenu}</p>
            <Link href="/admin/actualites" className="text-xs text-[#cc0000] hover:underline mt-3 block">Voir toutes →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
