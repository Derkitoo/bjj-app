import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, Search } from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ ceinture?: string; statut?: string }>;
}) {
  const params = await searchParams;
  const eleves = await prisma.eleve.findMany({
    where: {
      actif: params.statut === "inactif" ? false : params.statut === "actif" ? true : undefined,
      ceinture: params.ceinture ? (params.ceinture as never) : undefined,
    },
    include: { presences: { orderBy: { date: "desc" }, take: 1 } },
    orderBy: { nom: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Élèves</h1>
        <Link
          href="/admin/eleves/nouveau"
          className="flex items-center gap-2 bg-[#cc0000] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[#aa0000] transition-colors"
        >
          <UserPlus size={16} />
          Ajouter un élève
        </Link>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <select
          className="border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#cc0000]"
          defaultValue={params.ceinture || ""}
        >
          <option value="">Toutes les ceintures</option>
          <option value="BLANCHE">Blanche</option>
          <option value="BLEUE">Bleue</option>
          <option value="VIOLETTE">Violette</option>
          <option value="MARRON">Marron</option>
          <option value="NOIRE">Noire</option>
        </select>
        <select
          className="border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#cc0000]"
          defaultValue={params.statut || ""}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Élève</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Ceinture</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden sm:table-cell">Inscription</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden md:table-cell">Dernière présence</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map((eleve, i) => (
              <tr
                key={eleve.id}
                className={`border-b border-[#e5e5e5] hover:bg-[#fef2f2] transition-colors ${i % 2 === 0 ? "" : "bg-[#f9f9f9]"}`}
              >
                <td className="px-4 py-3">
                  <Link href={`/admin/eleves/${eleve.id}`} className="font-medium text-sm text-[#1a1a1a] hover:text-[#cc0000]">
                    {eleve.prenom} {eleve.nom}
                  </Link>
                  {eleve.email && <p className="text-xs text-[#666666]">{eleve.email}</p>}
                </td>
                <td className="px-4 py-3">
                  <CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} size="sm" />
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-sm text-[#666666]">
                  {format(new Date(eleve.dateInscription), "d MMM yyyy", { locale: fr })}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-sm text-[#666666]">
                  {eleve.presences[0]
                    ? format(new Date(eleve.presences[0].date), "d MMM yyyy", { locale: fr })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eleve.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {eleve.actif ? "Actif" : "Inactif"}
                  </span>
                </td>
              </tr>
            ))}
            {eleves.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#666666] text-sm py-8">Aucun élève trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
