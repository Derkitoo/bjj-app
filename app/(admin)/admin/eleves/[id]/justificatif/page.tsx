import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PrintButton from "./PrintButton";

const MOIS: Record<number, string> = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril", 5: "Mai", 6: "Juin",
  7: "Juillet", 8: "Août", 9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
};

const BELT_LABEL: Record<string, string> = {
  BLANCHE: "Ceinture Blanche", BLEUE: "Ceinture Bleue",
  VIOLETTE: "Ceinture Violette", MARRON: "Ceinture Marron", NOIRE: "Ceinture Noire",
};

export default async function JustificatifPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const annee = new Date().getFullYear();

  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: {
      presences: { orderBy: { date: "desc" } },
      paiements: {
        where: { annee },
        orderBy: { mois: "asc" },
      },
    },
  });

  if (!eleve) notFound();

  const paiementsPayes = eleve.paiements.filter((p) => p.statut === "PAYE");
  const totalPaye = paiementsPayes.reduce((acc, p) => acc + p.montant, 0);
  const presencesAnnee = eleve.presences.filter((p) => new Date(p.date).getFullYear() === annee).length;
  const today = new Date();

  return (
    <>
      {/* ── Barre de contrôle — masquée à l'impression ── */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Justificatif</h1>
          <p className="text-sm text-[#666666] mt-0.5">{eleve.prenom} {eleve.nom} — {annee}</p>
        </div>
        <div className="flex gap-3">
          <a href={`/admin/eleves/${id}`} className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm hover:bg-[#f9f9f9] transition-colors">
            ← Retour
          </a>
          <PrintButton />
        </div>
      </div>

      {/* ── Document imprimable ── */}
      <div className="bg-white rounded-[12px] shadow-sm p-10 max-w-2xl print:shadow-none print:rounded-none print:max-w-none print:p-8 print:m-0">
        {/* En-tête club */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#1a1a1a]">
          <div>
            <h2 className="text-2xl font-black text-[#cc0000] tracking-tight">BJJ CLUB</h2>
            <p className="text-xs text-[#666666] mt-1">Association de jiu-jitsu brésilien</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#666666]">Justificatif d&apos;adhésion</p>
            <p className="text-sm font-semibold text-[#1a1a1a]">Année {annee}</p>
            <p className="text-xs text-[#999999] mt-0.5">Émis le {format(today, "d MMMM yyyy", { locale: fr })}</p>
          </div>
        </div>

        {/* Identité élève */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">Adhérent</p>
          <div className="bg-[#f9f9f9] rounded-[10px] p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[#999999]">Nom complet</p>
              <p className="text-base font-bold text-[#1a1a1a] mt-0.5">{eleve.prenom} {eleve.nom}</p>
            </div>
            <div>
              <p className="text-xs text-[#999999]">Niveau</p>
              <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">{BELT_LABEL[eleve.ceinture] ?? eleve.ceinture}</p>
              {eleve.barrettes > 0 && <p className="text-xs text-[#666666]">{eleve.barrettes} barrette{eleve.barrettes > 1 ? "s" : ""}</p>}
            </div>
            {eleve.dateNaissance && (
              <div>
                <p className="text-xs text-[#999999]">Date de naissance</p>
                <p className="text-sm text-[#1a1a1a] mt-0.5">{format(new Date(eleve.dateNaissance), "d MMMM yyyy", { locale: fr })}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[#999999]">Membre depuis</p>
              <p className="text-sm text-[#1a1a1a] mt-0.5">{format(new Date(eleve.dateInscription), "MMMM yyyy", { locale: fr })}</p>
            </div>
          </div>
        </div>

        {/* Résumé activité */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">Activité {annee}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-[#e5e5e5] rounded-[10px] p-3 text-center">
              <p className="text-2xl font-black text-[#cc0000]">{presencesAnnee}</p>
              <p className="text-xs text-[#666666] mt-0.5">Cours effectués</p>
            </div>
            <div className="border border-[#e5e5e5] rounded-[10px] p-3 text-center">
              <p className="text-2xl font-black text-[#1a1a1a]">{paiementsPayes.length}</p>
              <p className="text-xs text-[#666666] mt-0.5">Mois réglés</p>
            </div>
            <div className="border border-[#e5e5e5] rounded-[10px] p-3 text-center">
              <p className="text-2xl font-black text-[#1a1a1a]">{totalPaye.toFixed(0)} €</p>
              <p className="text-xs text-[#666666] mt-0.5">Total versé</p>
            </div>
          </div>
        </div>

        {/* Détail paiements */}
        {eleve.paiements.length > 0 && (
          <div className="mb-7">
            <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">Détail des paiements {annee}</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5e5e5]">
                  <th className="text-left text-xs font-semibold text-[#666666] py-2">Période</th>
                  <th className="text-right text-xs font-semibold text-[#666666] py-2">Montant</th>
                  <th className="text-right text-xs font-semibold text-[#666666] py-2">Statut</th>
                  <th className="text-right text-xs font-semibold text-[#666666] py-2 hidden sm:table-cell">Date paiement</th>
                </tr>
              </thead>
              <tbody>
                {eleve.paiements.map((p) => (
                  <tr key={p.id} className="border-b border-[#f5f5f5]">
                    <td className="py-2 text-[#1a1a1a]">{MOIS[p.mois]} {p.annee}</td>
                    <td className="py-2 text-right text-[#1a1a1a] font-medium">{p.montant.toFixed(2)} €</td>
                    <td className="py-2 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.statut === "PAYE" ? "bg-green-100 text-green-700" :
                        p.statut === "EN_RETARD" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {p.statut === "PAYE" ? "Payé" : p.statut === "EN_RETARD" ? "En retard" : "En attente"}
                      </span>
                    </td>
                    <td className="py-2 text-right text-xs text-[#999999] hidden sm:table-cell">
                      {p.date ? format(new Date(p.date), "d MMM yyyy", { locale: fr }) : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#1a1a1a]">
                  <td className="py-2 font-bold text-[#1a1a1a]">Total réglé</td>
                  <td className="py-2 text-right font-bold text-[#1a1a1a]">{totalPaye.toFixed(2)} €</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-10 pt-6 border-t border-[#e5e5e5]">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-[#999999] mb-8">Signature du responsable</p>
              <div className="border-b border-[#1a1a1a] w-40" />
              <p className="text-xs text-[#999999] mt-1">Nom & cachet du club</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#999999]">Document généré par</p>
              <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">BJJ App</p>
              <p className="text-xs text-[#999999] mt-1">{format(today, "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          nav, aside, header, [data-sidebar] { display: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
