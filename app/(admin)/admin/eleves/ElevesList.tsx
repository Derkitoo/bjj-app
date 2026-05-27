"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  ceinture: string;
  barrettes: number;
  actif: boolean;
  categorie: string;
  dateInscription: string;
  presences: { date: string }[];
}

interface Props {
  eleves: Eleve[];
  initialCeinture: string;
  initialStatut: string;
}

const CEINTURES = [
  { value: "", label: "Toutes les ceintures" },
  { value: "BLANCHE", label: "Blanche" },
  { value: "BLEUE", label: "Bleue" },
  { value: "VIOLETTE", label: "Violette" },
  { value: "MARRON", label: "Marron" },
  { value: "NOIRE", label: "Noire" },
];

const STATUTS = [
  { value: "", label: "Tous les statuts" },
  { value: "actif", label: "Actifs" },
  { value: "inactif", label: "Inactifs" },
];

const CATEGORIES = [
  { value: "", label: "Tous" },
  { value: "ADULTES", label: "🥋 Adultes" },
  { value: "KIDS", label: "⭐ Kids" },
];

export default function ElevesList({ eleves, initialCeinture, initialStatut }: Props) {
  const [search, setSearch] = useState("");
  const [ceinture, setCeinture] = useState(initialCeinture);
  const [statut, setStatut] = useState(initialStatut);
  const [categorie, setCategorie] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return eleves.filter((e) => {
      if (ceinture && e.ceinture !== ceinture) return false;
      if (statut === "actif" && !e.actif) return false;
      if (statut === "inactif" && e.actif) return false;
      if (categorie && e.categorie !== categorie) return false;
      if (!q) return true;
      return (
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q) ||
        (e.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [eleves, search, ceinture, statut, categorie]);

  const selectClass = "border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[var(--color-primary)] bg-white";

  return (
    <>
      <div className="bg-white rounded-[12px] shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un élève..."
            className="w-full border border-[#e5e5e5] rounded-[8px] pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[#aaaaaa]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaaaaa] hover:text-[#666666]">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={ceinture} onChange={(e) => setCeinture(e.target.value)} className={selectClass}>
          {CEINTURES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className={selectClass}>
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="flex items-center gap-1 border border-[#e5e5e5] rounded-[8px] p-1 bg-white">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategorie(c.value)}
              className={`px-3 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                categorie === c.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[#666666] hover:bg-[#f5f5f5]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {(search || ceinture || statut || categorie) && (
          <span className="flex items-center text-xs text-[#666666] ml-1">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
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
            {filtered.map((eleve, i) => (
              <tr
                key={eleve.id}
                className={`border-b border-[#e5e5e5] hover:bg-[var(--color-primary-bg)] transition-colors ${i % 2 === 0 ? "" : "bg-[#f9f9f9]"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/eleves/${eleve.id}`} className="font-medium text-sm text-[#1a1a1a] hover:text-[var(--color-primary)]">
                      {eleve.prenom} {eleve.nom}
                    </Link>
                    {eleve.categorie === "KIDS" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">⭐ Kids</span>
                    )}
                  </div>
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
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${eleve.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {eleve.actif ? "Actif" : "Inactif"}
                    </span>
                    {eleve.actif && (() => {
                      const last = eleve.presences[0]?.date;
                      const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
                      if (days === null || days > 30) {
                        return (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600 w-fit">
                            {days === null ? "Jamais venu" : `Absent ${days}j`}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#666666] text-sm py-8">
                  {search ? `Aucun résultat pour "${search}"` : "Aucun élève trouvé"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
