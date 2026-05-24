"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Clock, AlertCircle, Plus } from "lucide-react";

interface Paiement {
  id: string;
  mois: number;
  annee: number;
  montant: number;
  statut: string;
  date: string | null;
  eleve: { nom: string; prenom: string; actif: boolean };
}

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const statutIcon = { PAYE: CheckCircle, EN_ATTENTE: Clock, RETARD: AlertCircle };
const statutColor = { PAYE: "text-green-600", EN_ATTENTE: "text-orange-500", RETARD: "text-red-600" };
const statutLabel = { PAYE: "Payé", EN_ATTENTE: "En attente", RETARD: "Retard" };

export default function PaiementsPage() {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [generating, setGenerating] = useState(false);
  const [montant, setMontant] = useState("50");

  const load = useCallback(() => {
    fetch(`/api/paiements?mois=${mois}&annee=${annee}`)
      .then((r) => r.json())
      .then(setPaiements);
  }, [mois, annee]);

  useEffect(() => { load(); }, [load]);

  const generer = async () => {
    setGenerating(true);
    const res = await fetch("/api/paiements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mois, annee, montant: parseFloat(montant) }),
    });
    const data = await res.json();
    setGenerating(false);
    if (data.created > 0) load();
  };

  const changerStatut = async (id: string, statut: string) => {
    await fetch(`/api/paiements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setPaiements((prev) => prev.map((p) => p.id === id ? { ...p, statut, date: statut === "PAYE" ? new Date().toISOString() : null } : p));
  };

  const total = paiements.reduce((s, p) => s + p.montant, 0);
  const totalPaye = paiements.filter((p) => p.statut === "PAYE").reduce((s, p) => s + p.montant, 0);
  const nbAttente = paiements.filter((p) => p.statut !== "PAYE").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Paiements</h1>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">Mois</label>
          <select value={mois} onChange={(e) => setMois(parseInt(e.target.value))}
            className="border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]">
            {MOIS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">Année</label>
          <select value={annee} onChange={(e) => setAnnee(parseInt(e.target.value))}
            className="border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]">
            {[2024, 2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">Montant (€)</label>
          <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} min="0" step="5"
            className="border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000] w-24" />
        </div>
        <button onClick={generer} disabled={generating}
          className="flex items-center gap-2 bg-[#cc0000] text-white rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#aa0000] disabled:opacity-50 transition-colors">
          <Plus size={15} />
          {generating ? "Génération..." : "Générer le mois"}
        </button>
      </div>

      {paiements.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Total attendu</p>
            <p className="text-xl font-bold text-[#1a1a1a] mt-1">{total} €</p>
          </div>
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Encaissé</p>
            <p className="text-xl font-bold text-green-600 mt-1">{totalPaye} €</p>
          </div>
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">En attente</p>
            <p className="text-xl font-bold text-orange-500 mt-1">{nbAttente} élève{nbAttente > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {paiements.length === 0 ? (
        <div className="bg-white rounded-[12px] shadow-sm p-8 text-center">
          <p className="text-sm text-[#666666]">Aucun paiement pour {MOIS[mois - 1]} {annee}.</p>
          <p className="text-xs text-[#999999] mt-1">Clique sur &quot;Générer le mois&quot; pour créer les lignes de paiement.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Élève</th>
                <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Montant</th>
                <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Statut</th>
                <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden md:table-cell">Date paiement</th>
                <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {paiements.map((p, i) => {
                const Icon = statutIcon[p.statut as keyof typeof statutIcon] ?? Clock;
                const color = statutColor[p.statut as keyof typeof statutColor] ?? "text-orange-500";
                const label = statutLabel[p.statut as keyof typeof statutLabel] ?? p.statut;
                return (
                  <tr key={p.id} className={`border-b border-[#e5e5e5] ${i % 2 === 0 ? "" : "bg-[#f9f9f9]"}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[#1a1a1a]">
                      {p.eleve.prenom} {p.eleve.nom}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1a1a1a]">{p.montant} €</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
                        <Icon size={13} />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#666666] hidden md:table-cell">
                      {p.date ? format(new Date(p.date), "d MMM yyyy", { locale: fr }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.statut !== "PAYE" ? (
                        <button onClick={() => changerStatut(p.id, "PAYE")}
                          className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-[6px] px-3 py-1 hover:bg-green-100 transition-colors">
                          Marquer payé
                        </button>
                      ) : (
                        <button onClick={() => changerStatut(p.id, "EN_ATTENTE")}
                          className="text-xs text-[#666666] hover:text-[#1a1a1a] transition-colors">
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
