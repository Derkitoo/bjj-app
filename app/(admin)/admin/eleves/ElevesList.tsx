"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, SlidersHorizontal } from "lucide-react";
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
  { value: "", label: "Toutes" },
  { value: "BLANCHE", label: "Blanche" },
  { value: "BLEUE", label: "Bleue" },
  { value: "VIOLETTE", label: "Violette" },
  { value: "MARRON", label: "Marron" },
  { value: "NOIRE", label: "Noire" },
];

const STATUTS = [
  { value: "", label: "Tous" },
  { value: "actif", label: "Actifs" },
  { value: "inactif", label: "Inactifs" },
];

const CATEGORIES = [
  { value: "", label: "Tous" },
  { value: "ADULTES", label: "🥋 Adultes" },
  { value: "KIDS", label: "⭐ Enfants" },
];

const getInactivityBadge = (presences: { date: string }[], actif: boolean) => {
  if (!actif) return null;
  const last = presences[0]?.date;
  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
  if (days === null || days > 30) {
    return days === null ? "Jamais venu" : `Absent ${days}j`;
  }
  return null;
};

export default function ElevesList({ eleves, initialCeinture, initialStatut }: Props) {
  const [search, setSearch] = useState("");
  const [ceinture, setCeinture] = useState(initialCeinture);
  const [statut, setStatut] = useState(initialStatut);
  const [categorie, setCategorie] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  const hasFilters = ceinture || statut || categorie;
  const selectClass = "border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[var(--color-primary)] bg-white";

  return (
    <>
      {/* ── Barre de recherche + filtres ── */}
      <div className="bg-white rounded-[12px] shadow-sm p-3 mb-4 space-y-3">
        {/* Ligne 1 : search + bouton filtres mobile */}
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-sm border transition-colors ${
              hasFilters
                ? "bg-[var(--color-primary-subtle)] border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-[#e5e5e5] text-[#666666]"
            }`}
          >
            <SlidersHorizontal size={14} />
            {hasFilters ? "Filtrés" : "Filtres"}
          </button>
        </div>

        {/* Ligne 2 : filtres — toujours visibles sur desktop, toggle sur mobile */}
        <div className={`flex flex-wrap gap-2 ${showFilters ? "flex" : "hidden md:flex"}`}>
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
          {hasFilters && (
            <button
              onClick={() => { setCeinture(""); setStatut(""); setCategorie(""); }}
              className="flex items-center gap-1 text-xs text-[#999999] hover:text-[#666666] px-2"
            >
              <X size={12} />
              Effacer
            </button>
          )}
        </div>

        {(search || hasFilters) && (
          <p className="text-xs text-[#999999]">
            {filtered.length} élève{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Mobile : cartes ── */}
      <div className="md:hidden space-y-2">
        {filtered.map((eleve) => {
          const badge = getInactivityBadge(eleve.presences, eleve.actif);
          return (
            <Link
              key={eleve.id}
              href={`/admin/eleves/${eleve.id}`}
              className="bg-white rounded-[12px] shadow-sm p-4 flex items-center gap-3 active:bg-[#f9f9f9] transition-colors block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-[#1a1a1a] truncate">
                    {eleve.prenom} {eleve.nom}
                  </p>
                  {eleve.categorie === "KIDS" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">⭐</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} size="sm" />
                  {badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600">
                      {badge}
                    </span>
                  )}
                  {!eleve.actif && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                      Inactif
                    </span>
                  )}
                </div>
                {eleve.email && (
                  <p className="text-xs text-[#999999] mt-1 truncate">{eleve.email}</p>
                )}
              </div>
              <div className="text-xs text-[#cccccc] flex-shrink-0">›</div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-[12px] shadow-sm p-8 text-center">
            <p className="text-sm text-[#666666]">
              {search ? `Aucun résultat pour "${search}"` : "Aucun élève trouvé"}
            </p>
          </div>
        )}
      </div>

      {/* ── Desktop : tableau ── */}
      <div className="hidden md:block bg-white rounded-[12px] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Élève</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Ceinture</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden sm:table-cell">Inscription</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden lg:table-cell">Dernière présence</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((eleve, i) => {
              const badge = getInactivityBadge(eleve.presences, eleve.actif);
              return (
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
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">⭐ Enfants</span>
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
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-[#666666]">
                    {eleve.presences[0]
                      ? format(new Date(eleve.presences[0].date), "d MMM yyyy", { locale: fr })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${eleve.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {eleve.actif ? "Actif" : "Inactif"}
                      </span>
                      {badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600 w-fit">
                          {badge}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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
