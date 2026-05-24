import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Users, CheckSquare, Award, Newspaper, TrendingUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalEleves, presencesAujourdhui, lastPost, criteres, eleves] = await Promise.all([
    prisma.eleve.count({ where: { actif: true } }),
    prisma.presence.count({ where: { date: { gte: startOfDay } } }),
    prisma.post.findFirst({ where: { publie: true }, orderBy: { createdAt: "desc" } }),
    prisma.criterePromotion.findMany(),
    prisma.eleve.findMany({
      where: { actif: true },
      include: { presences: true, promotions: { orderBy: { date: "desc" }, take: 1 } },
    }),
  ]);

  const ORDER: Record<string, number> = { BLANCHE: 0, BLEUE: 1, VIOLETTE: 2, MARRON: 3, NOIRE: 4 };
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

  const presencesMois = await prisma.presence.count({ where: { date: { gte: startOfMonth } } });
  const tauxPresence = totalEleves > 0 ? Math.round((presencesMois / (totalEleves * 4)) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#666666] text-sm">Présents aujourd&apos;hui</span>
            <CheckSquare size={18} className="text-[#cc0000]" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{presencesAujourdhui}</p>
          <p className="text-xs text-[#666666] mt-1">sur {totalEleves} élèves actifs</p>
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
            <span className="text-[#666666] text-sm">Éligibles à promotion</span>
            <Award size={18} className="text-[#cc0000]" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{eligibles.length}</p>
          <Link href="/admin/ceintures" className="text-xs text-[#cc0000] hover:underline mt-1 block">Voir les ceintures</Link>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#666666] text-sm">Taux de présence (mois)</span>
            <TrendingUp size={18} className="text-[#cc0000]" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{tauxPresence}%</p>
          <p className="text-xs text-[#666666] mt-1">{presencesMois} présences ce mois</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {eligibles.length > 0 && (
          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="text-[#1a1a1a] font-semibold mb-4 flex items-center gap-2">
              <Award size={18} className="text-[#cc0000]" />
              Élèves éligibles à promotion
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

        {lastPost && (
          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="text-[#1a1a1a] font-semibold mb-4 flex items-center gap-2">
              <Newspaper size={18} className="text-[#cc0000]" />
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
