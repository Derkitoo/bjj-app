"use client";

import { useState } from "react";
import { Printer, Pencil, X, Check, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const BELT_LABEL: Record<string, string> = {
  BLANCHE: "Ceinture Blanche", BLEUE: "Ceinture Bleue",
  VIOLETTE: "Ceinture Violette", MARRON: "Ceinture Marron", NOIRE: "Ceinture Noire",
};

const MODE_LABEL: Record<string, string> = {
  especes: "Espèces", cheque: "Chèque", virement: "Virement", cb: "Carte bancaire",
};

const STATUT_CONFIG: Record<string, { label: string; cls: string }> = {
  COMPLETE:   { label: "Complet",     cls: "bg-green-100 text-green-700" },
  EN_COURS:   { label: "En cours",    cls: "bg-blue-100 text-blue-700" },
  EN_RETARD:  { label: "En retard",   cls: "bg-red-100 text-red-700" },
  EN_ATTENTE: { label: "En attente",  cls: "bg-orange-100 text-orange-700" },
  ANNULE:     { label: "Annulé",      cls: "bg-gray-100 text-gray-500" },
};

interface Echeance {
  id: string;
  numero: number;
  montant: number;
  dateLimite: string;
  datePaiement: string | null;
  statut: string;
  modePaiement: string | null;
}

interface Cotisation {
  saison: string;
  montantBase: number;
  reductionRenouvellement: number;
  reductionFamille: number;
  reductionManuelle: number;
  montantTotal: number;
  nbEcheances: number;
  statut: string;
  echeances: Echeance[];
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
  saison: string;
  cotisation: Cotisation | null;
  today: string;
}

export default function JustificatifClient({
  eleveId, nom, prenom, ceinture, barrettes,
  dateNaissance, dateInscription,
  presencesAnnee, saison, cotisation, today,
}: Props) {
  const [nomClub, setNomClub] = useState("JCRV");
  const [descClub, setDescClub] = useState("Association de jiu-jitsu brésilien");
  const [adresseClub, setAdresseClub] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const totalPaye = cotisation?.echeances
    .filter((e) => e.statut === "PAYE")
    .reduce((s, e) => s + e.montant, 0) ?? 0;

  const totalReduction = cotisation
    ? cotisation.reductionRenouvellement + cotisation.reductionFamille + cotisation.reductionManuelle
    : 0;

  const inputClass = "border border-[#e5e5e5] rounded-[8px] px-3 py-1.5 text-sm focus:outline-none focus:border-[#cc0000] bg-white w-full";

  return (
    <>
      {/* ── Barre de contrôle ── */}
      <div className="print:hidden mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Justificatif</h1>
            <p className="text-sm text-[#666666] mt-0.5">{prenom} {nom} — Saison {saison}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/admin/eleves/${eleveId}`} className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm hover:bg-[#f9f9f9] transition-colors">
              ← Retour
            </Link>
            <button
              onClick={() => setShowEdit((v) => !v)}
              className={`flex items-center gap-2 border rounded-[8px] px-4 py-2 text-sm transition-colors ${showEdit ? "border-[#cc0000] text-[#cc0000] bg-[#fff5f5]" : "border-[#e5e5e5] text-[#666666] hover:bg-[#f9f9f9]"}`}
            >
              {showEdit ? <X size={14} /> : <Pencil size={14} />}
              Personnaliser
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

        {showEdit && (
          <div className="bg-white rounded-[12px] shadow-sm p-5 border border-[#e5e5e5] space-y-3">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-3">Informations du club</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Nom du club</label>
                <input value={nomClub} onChange={(e) => setNomClub(e.target.value)} className={inputClass} placeholder="JCRV" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Description</label>
                <input value={descClub} onChange={(e) => setDescClub(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Adresse (facultatif)</label>
                <input value={adresseClub} onChange={(e) => setAdresseClub(e.target.value)} className={inputClass} placeholder="12 rue des Arts, Paris" />
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
            <p className="text-sm font-semibold text-[#1a1a1a]">Saison {saison}</p>
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
          <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">Activité — saison {saison}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-[#e5e5e5] rounded-[10px] p-3 text-center">
              <p className="text-2xl font-black text-[#cc0000]">{presencesAnnee}</p>
              <p className="text-xs text-[#666666] mt-0.5">Cours effectués</p>
            </div>
            <div className="border border-[#e5e5e5] rounded-[10px] p-3 text-center">
              <p className="text-2xl font-black text-[#1a1a1a]">{totalPaye.toFixed(0)} €</p>
              <p className="text-xs text-[#666666] mt-0.5">Montant versé</p>
            </div>
            <div className="border border-[#e5e5e5] rounded-[10px] p-3 text-center">
              <p className="text-2xl font-black text-[#1a1a1a]">{cotisation?.montantTotal.toFixed(0) ?? "—"} €</p>
              <p className="text-xs text-[#666666] mt-0.5">Cotisation totale</p>
            </div>
          </div>
        </div>

        {/* Cotisation annuelle */}
        {cotisation ? (
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider">Cotisation annuelle</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_CONFIG[cotisation.statut]?.cls ?? "bg-gray-100 text-gray-500"}`}>
                {STATUT_CONFIG[cotisation.statut]?.label ?? cotisation.statut}
              </span>
            </div>

            {/* Détail tarif */}
            <div className="bg-[#f9f9f9] rounded-[10px] p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#666666]">Tarif de base</span>
                <span className="font-medium">{cotisation.montantBase.toFixed(2)} €</span>
              </div>
              {cotisation.reductionRenouvellement > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Réduction renouvellement</span>
                  <span>−{cotisation.reductionRenouvellement.toFixed(2)} €</span>
                </div>
              )}
              {cotisation.reductionFamille > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Réduction famille</span>
                  <span>−{cotisation.reductionFamille.toFixed(2)} €</span>
                </div>
              )}
              {cotisation.reductionManuelle > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Réduction manuelle</span>
                  <span>−{cotisation.reductionManuelle.toFixed(2)} €</span>
                </div>
              )}
              {totalReduction > 0 && (
                <div className="border-t border-[#e5e5e5] pt-2 flex justify-between font-bold text-[#1a1a1a]">
                  <span>Total</span>
                  <span>{cotisation.montantTotal.toFixed(2)} €</span>
                </div>
              )}
            </div>

            {/* Échéances */}
            <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">
              {cotisation.nbEcheances === 1 ? "Paiement unique" : `Paiement en ${cotisation.nbEcheances} fois`}
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5e5e5]">
                  <th className="text-left text-xs font-semibold text-[#666666] py-2">Échéance</th>
                  <th className="text-right text-xs font-semibold text-[#666666] py-2">Montant</th>
                  <th className="text-right text-xs font-semibold text-[#666666] py-2">Mode</th>
                  <th className="text-right text-xs font-semibold text-[#666666] py-2">Date</th>
                  <th className="text-right text-xs font-semibold text-[#666666] py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {cotisation.echeances.map((e) => (
                  <tr key={e.id} className="border-b border-[#f5f5f5]">
                    <td className="py-2 text-[#666666]">
                      {e.numero === 1 ? "1ère" : `${e.numero}ème`} versement
                    </td>
                    <td className="py-2 text-right font-medium text-[#1a1a1a]">{e.montant.toFixed(2)} €</td>
                    <td className="py-2 text-right text-xs text-[#666666]">
                      {e.modePaiement ? MODE_LABEL[e.modePaiement] ?? e.modePaiement : "—"}
                    </td>
                    <td className="py-2 text-right text-xs text-[#999999]">
                      {e.datePaiement ? format(new Date(e.datePaiement), "d MMM yyyy", { locale: fr }) : "—"}
                    </td>
                    <td className="py-2 text-right">
                      {e.statut === "PAYE" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                          <Check size={11} /> Payé
                        </span>
                      ) : new Date(e.dateLimite) < new Date() ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle size={11} /> En retard
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                          <Clock size={11} /> En attente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#1a1a1a]">
                  <td className="py-2 font-bold text-[#1a1a1a]">Total versé</td>
                  <td className="py-2 text-right font-bold text-[#1a1a1a]">{totalPaye.toFixed(2)} €</td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mb-7 border border-[#e5e5e5] rounded-[10px] p-4 text-center text-sm text-[#999999]">
            Aucune cotisation enregistrée pour la saison {saison}
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
