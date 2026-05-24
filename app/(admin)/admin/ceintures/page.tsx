import { prisma } from "@/lib/prisma";
import CeintureBadge from "@/components/CeintureBadge";
import PromouvoirButton from "./PromouvoirButton";
import Link from "next/link";
import { Award, Settings } from "lucide-react";

const NEXT: Record<string, string> = { BLANCHE: "BLEUE", BLEUE: "VIOLETTE", VIOLETTE: "MARRON", MARRON: "NOIRE" };

export default async function CeinturesPage() {
  const [eleves, criteres] = await Promise.all([
    prisma.eleve.findMany({
      where: { actif: true },
      include: {
        presences: true,
        promotions: { orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: { nom: "asc" },
    }),
    prisma.criterePromotion.findMany(),
  ]);

  const today = new Date();

  const elevesAvecProgression = eleves.map((e) => {
    const nextBelt = NEXT[e.ceinture];
    if (!nextBelt) return { ...e, progression: 100, eligible: false, nextBelt: null };

    const critere = criteres.find((c) => c.ceintureCible === nextBelt);
    if (!critere) return { ...e, progression: 0, eligible: false, nextBelt };

    const lastPromo = e.promotions[0];
    const moisDepuis = lastPromo
      ? (today.getTime() - new Date(lastPromo.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      : 999;

    const progCours = critere.minCours > 0 ? Math.min(e.presences.length / critere.minCours, 1) : 1;
    const progMois = critere.minMois > 0 ? Math.min(moisDepuis / critere.minMois, 1) : 1;
    const progression = Math.round(((progCours + progMois) / 2) * 100);
    const eligible = progCours >= 1 && progMois >= 1;

    return { ...e, progression, eligible, nextBelt };
  });

  const eligibles = elevesAvecProgression.filter((e) => e.eligible);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Ceintures</h1>
        <Link href="/admin/ceintures/criteres"
          className="flex items-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#f9f9f9] transition-colors">
          <Settings size={15} />
          Critères
        </Link>
      </div>

      {eligibles.length > 0 && (
        <div className="bg-[#fef2f2] border border-[#cc0000]/20 rounded-[12px] p-5 mb-6">
          <h2 className="font-semibold text-[#cc0000] flex items-center gap-2 mb-3">
            <Award size={18} />
            Éligibles à promotion ({eligibles.length})
          </h2>
          <div className="grid gap-3">
            {eligibles.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-white rounded-[8px] p-3">
                <div className="flex items-center gap-3">
                  <CeintureBadge ceinture={e.ceinture} barrettes={e.barrettes} size="sm" />
                  <span className="text-sm font-medium text-[#1a1a1a]">{e.prenom} {e.nom}</span>
                  <span className="text-xs text-[#666666]">→ {e.nextBelt?.toLowerCase()}</span>
                </div>
                {e.nextBelt && <PromouvoirButton eleveId={e.id} nouvelleCeinture={e.nextBelt} nom={`${e.prenom} ${e.nom}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Élève</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Ceinture</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden md:table-cell">Progression</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Cours</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {elevesAvecProgression.map((eleve, i) => (
              <tr key={eleve.id} className={`border-b border-[#e5e5e5] ${i % 2 === 0 ? "" : "bg-[#f9f9f9]"}`}>
                <td className="px-4 py-3 text-sm font-medium text-[#1a1a1a]">{eleve.prenom} {eleve.nom}</td>
                <td className="px-4 py-3"><CeintureBadge ceinture={eleve.ceinture} size="sm" /></td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {eleve.nextBelt ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#e5e5e5] rounded-full h-2 max-w-[120px]">
                        <div className="bg-[#cc0000] h-2 rounded-full" style={{ width: `${eleve.progression}%` }} />
                      </div>
                      <span className="text-xs text-[#666666]">{eleve.progression}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#666666]">Ceinture max</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#666666]">{eleve.presences.length}</td>
                <td className="px-4 py-3">
                  {eleve.nextBelt && (
                    <PromouvoirButton eleveId={eleve.id} nouvelleCeinture={eleve.nextBelt} nom={`${eleve.prenom} ${eleve.nom}`} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
