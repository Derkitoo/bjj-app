"use client";

import { useState } from "react";
import { Printer, Pencil, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MOIS: Record<number, string> = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril", 5: "Mai", 6: "Juin",
  7: "Juillet", 8: "Août", 9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
};

const BELT_LABEL: Record<string, string> = {
  BLANCHE: "Ceinture Blanche", BLEUE: "Ceinture Bleue",
  VIOLETTE: "Ceinture Violette", MARRON: "Ceinture Marron", NOIRE: "Ceinture Noire",
};

interface Paiement {
  id: string;
  mois: number;
  annee: number;
  montant: number;
  statut: string;
  date: string | null;
}

interface Props {
  eleveId: string;
  nom: string;
  prenom: string;
  ceinture: string;
  barrettes: number;
  dateNaissance: string | null;
  dateInscription: string;
  presencesAnnee: number;
  paiements: Paiement[];
  totalPaye: number;
  annee: number;
  today: string;
}

export default function JustificatifClient({
  eleveId, nom, prenom, ceinture, barrettes,
  dateNaissance, dateInscription,
  presencesAnnee, paiements, totalPaye, annee, today,
}: Props) {
  const [nomClub, setNomClub] = useState("JCRV");
  const [descClub, setDescClub] = useState("Association de jiu-jitsu brésilien");
  const [adresseClub, setAdresseClub] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const paiementsPayes = paiements.filter((p) => p.statut === "PAYE");
  const inputClass = "border border-[#e5e5e5] rounded-[8px] px-3 py-1.5 text-sm focus:outline-none focus:border-[#cc0000] bg-white w-full";

  return (
    <>
      {/* ── Barre de contrôle ── */}
      <div className="print:hidden mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Justificatif</h1>
            <p className="text-sm text-[#666666] mt-0.5">{prenom} {nom} — {annee}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/eleves/${eleveId}`} className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm hover:bg-[#f9f9f9] transition-colors">
              ← Retour
            </Link>
            <button
              onClick={() => setShowEdit((v) => !v)}
              className={`flex items-center gap-2 border rounded-[8px] px-4 py-2 text-sm transition-colors ${showEdit ? "border-[#cc0000] text-[#cc0000] bg-[#fff5f5]" : "border-[#e5e5e5] text-[#666666] hover:bg-[#f9f9f9]"}`}
            >
              {showEdit ? <X size={14} /> : <Pencil size={14} />}
              {showEdit ? "Fermer" : "Personnaliser"}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#cc0000] text-white rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#aa0000] transition-colors"
            >
              <Printer size={15} />
              Imprimer / PDF
            </button>
          </div>
        </div>

        {/* Panneau d'édition */}
        {showEdit && (
          <div className="bg-white rounded-[12px] shadow-sm p-5 border border-[#e5e5e5] space-y-3">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-3">Informations du club (modifiables avant impression)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Nom du club</label>
                <input value={nomClub} onChange={(e) => setNomClub(e.target.value)} className={inputClass} placeholder="JCRV" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Description</label>
                <input value={descClub} onChange={(e) => setDescClub(e.target.value)} className={inputClass} placeholder="Association de jiu-jitsu brésilien" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Adresse (facultatif)</label>
                <input value={adresseClub} onChange={(e) => setAdresseClub(e.target.value)} className={inputClass} placeholder="Ex : 12 rue des Arts, Paris" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Document imprimable ── */}
      <div className="bg-white rounded-[12px] shadow-sm p-10 max-w-2xl print:shadow-none print:rounded-none print:max-w-none print:p-8 print:m-0">

        {/* En-tête club */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#1a1a1a]">
          <div>
            <h2 className="text-2xl font-black text-[#cc0000] tracking-tight">{nomClub || "JCRV"}</h2>
            <p className="text-xs text-[#666666] mt-1">{descClub}</p>
            {adresseClub && <p className="text-xs text-[#999999] mt-0.5">{adresseClub}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-[#666666]">Justificatif d&apos;adhésion</p>
            <p className="text-sm font-semibold text-[#1a1a1a]">Année {annee}</p>
            <p className="text-xs text-[#999999] mt-0.5">Émis le {format(new Date(today), "d MMMM yyyy", { locale: fr })}</p>
          </div>
        </div>

        {/* Identité élève */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">Adhérent</p>
          <div className="bg-[#f9f9f9] rounded-[10px] p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[#999999]">Nom complet</p>
              <p className="text-base font-bold text-[#1a1a1a] mt-0.5">{prenom} {nom}</p>
            </div>
            <div>
              <p className="text-xs text-[#999999]">Niveau</p>
              <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">{BELT_LABEL[ceinture] ?? ceinture}</p>
              {barrettes > 0 && <p className="text-xs text-[#666666]">{barrettes} barrette{barrettes > 1 ? "s" : ""}</p>}
            </div>
            {dateNaissance && (
              <div>
                <p className="text-xs text-[#999999]">Date de naissance</p>
                <p className="text-sm text-[#1a1a1a] mt-0.5">{format(new Date(dateNaissance), "d MMMM yyyy", { locale: fr })}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[#999999]">Membre depuis</p>
              <p className="text-sm text-[#1a1a1a] mt-0.5">{format(new Date(dateInscription), "MMMM yyyy", { locale: fr })}</p>
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
        {paiements.length > 0 && (
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
                {paiements.map((p) => (
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
              <p className="text-xs text-[#999999] mt-1">{nomClub || "JCRV"} — Nom & cachet</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#999999]">Document généré par</p>
              <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">{nomClub || "JCRV"} App</p>
              <p className="text-xs text-[#999999] mt-1">{format(new Date(today), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
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
