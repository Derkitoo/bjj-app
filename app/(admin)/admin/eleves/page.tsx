import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, Upload, Award } from "lucide-react";
import ElevesList from "./ElevesList";

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ ceinture?: string; statut?: string }>;
}) {
  const params = await searchParams;
  const eleves = await prisma.eleve.findMany({
    include: { presences: { orderBy: { date: "desc" }, take: 1 } },
    orderBy: { nom: "asc" },
  });

  const serialized = eleves.map((e) => ({
    ...e,
    dateInscription: e.dateInscription.toISOString(),
    presences: e.presences.map((p) => ({ date: p.date.toISOString() })),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Élèves</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/examens/nouveau"
            className="flex items-center gap-2 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-[8px] px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-subtle)] transition-colors"
          >
            <Award size={15} />
            <span className="hidden sm:inline">Créer un examen</span>
            <span className="sm:hidden">Examen</span>
          </Link>
          <Link
            href="/admin/eleves/import"
            className="flex items-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-3 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
          >
            <Upload size={15} />
            <span className="hidden sm:inline">Importer CSV</span>
          </Link>
          <Link
            href="/admin/eleves/nouveau"
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Ajouter un élève</span>
            <span className="sm:hidden">Ajouter</span>
          </Link>
        </div>
      </div>

      <ElevesList
        eleves={serialized}
        initialCeinture={params.ceinture ?? ""}
        initialStatut={params.statut ?? ""}
      />
    </div>
  );
}
