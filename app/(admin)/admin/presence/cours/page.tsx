"use client";

import { useState, useEffect } from "react";
import { Users, X, Plus, Trash2, Search, ChevronRight } from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";

interface Cours {
  id: string;
  type: string;
  jour: number;
  heureDebut: string;
  duree: number;
  titre: string | null;
  recurrent: boolean;
  annule: boolean;
  _count?: { presences: number };
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  ceinture: string;
  barrettes: number;
}

interface Presence {
  id: string;
  eleveId: string;
  eleve: Eleve;
}

const JOURS: Record<number, string> = { 0: "Dimanche", 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi" };
const TYPES: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Kids", COMPETITION: "Compétition", OPEN_MAT: "Open Mat" };
const TYPE_DOTS: Record<string, string> = { GI: "#3b82f6", NO_GI: "#8b5cf6", KIDS: "#22c55e", COMPETITION: "#ef4444", OPEN_MAT: "#94a3b8" };

const formatDuree = (min: number) => {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h}h`;
};

export default function PresenceCoursPage() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [selected, setSelected] = useState<Cours | null>(null);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [allEleves, setAllEleves] = useState<Eleve[]>([]);
  const [searchAdd, setSearchAdd] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [presenceCounts, setPresenceCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/cours").then((r) => r.json()).then((data: Cours[]) => {
      const actifs = data.filter((c) => !c.annule);
      setCours(actifs);
      Promise.all(
        actifs.map((c) =>
          fetch(`/api/presences/cours/${c.id}`)
            .then((r) => r.json())
            .then((p: Presence[]) => ({ id: c.id, count: p.length }))
        )
      ).then((counts) => {
        const map: Record<string, number> = {};
        counts.forEach(({ id, count }) => { map[id] = count; });
        setPresenceCounts(map);
      });
    });
    fetch("/api/eleves").then((r) => r.json()).then(setAllEleves);
  }, []);

  const openCours = async (c: Cours) => {
    setSelected(c);
    setShowAdd(false);
    setSearchAdd("");
    const data = await fetch(`/api/presences/cours/${c.id}`).then((r) => r.json());
    setPresences(data);
  };

  const ajouterPresence = async (eleveId: string) => {
    if (!selected) return;
    const res = await fetch(`/api/presences/cours/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eleveId }),
    });
    if (res.ok) {
      const p = await res.json();
      setPresences((prev) => [...prev, p]);
      setPresenceCounts((prev) => ({ ...prev, [selected.id]: (prev[selected.id] ?? 0) + 1 }));
      setSearchAdd("");
      setShowAdd(false);
    }
  };

  const supprimerPresence = async (eleveId: string) => {
    if (!selected) return;
    const res = await fetch(`/api/presences/cours/${selected.id}?eleveId=${eleveId}`, { method: "DELETE" });
    if (res.ok) {
      setPresences((prev) => prev.filter((p) => p.eleveId !== eleveId));
      setPresenceCounts((prev) => ({ ...prev, [selected.id]: Math.max(0, (prev[selected.id] ?? 1) - 1) }));
    }
  };

  const absentIds = new Set(presences.map((p) => p.eleveId));
  const eligibles = allEleves.filter((e) => {
    if (absentIds.has(e.id)) return false;
    const q = searchAdd.toLowerCase();
    return !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q);
  });

  const groupedCours = [1, 2, 3, 4, 5, 6, 0].reduce<Record<number, Cours[]>>((acc, j) => {
    const cs = cours.filter((c) => c.jour === j).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    if (cs.length) acc[j] = cs;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Présence par cours</h1>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* ── Liste des cours ── */}
        <div className="lg:w-80 flex-shrink-0 space-y-3">
          {Object.entries(groupedCours).map(([jourStr, coursDuJour]) => {
            const jour = Number(jourStr);
            return (
              <div key={jour} className="bg-white rounded-[12px] shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#f0f0f0]">
                  <h3 className="font-semibold text-sm text-[#1a1a1a]">{JOURS[jour]}</h3>
                </div>
                <div className="divide-y divide-[#f7f7f7]">
                  {coursDuJour.map((c) => {
                    const isActive = selected?.id === c.id;
                    const count = presenceCounts[c.id] ?? 0;
                    return (
                      <button
                        key={c.id}
                        onClick={() => openCours(c)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-primary-bg)] ${isActive ? "bg-[var(--color-primary-bg)]" : ""}`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_DOTS[c.type] ?? "#aaa" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a]">{TYPES[c.type]}</p>
                          <p className="text-xs text-[#999999]">{c.heureDebut} · {formatDuree(c.duree)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs font-semibold text-[#666666] tabular-nums">{count}</span>
                          <Users size={12} className="text-[#cccccc]" />
                          <ChevronRight size={14} className={`text-[#cccccc] ${isActive ? "text-[var(--color-primary)]" : ""}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {cours.length === 0 && (
            <div className="bg-white rounded-[12px] shadow-sm p-8 text-center">
              <p className="text-sm text-[#666666]">Aucun cours programmé</p>
            </div>
          )}
        </div>

        {/* ── Détail présences ── */}
        {selected ? (
          <div className="flex-1 bg-white rounded-[12px] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
              <div>
                <p className="font-bold text-[#1a1a1a]">
                  {JOURS[selected.jour]} · {TYPES[selected.type]}
                </p>
                <p className="text-xs text-[#999999] mt-0.5">{selected.heureDebut} · {formatDuree(selected.duree)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  {presences.length} présent{presences.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setShowAdd((v) => !v)}
                  className="flex items-center gap-1.5 bg-[var(--color-primary)] text-white rounded-[8px] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  <Plus size={13} />
                  Ajouter
                </button>
                <button onClick={() => setSelected(null)} className="text-[#aaaaaa] hover:text-[#666666] p-1">
                  <X size={16} />
                </button>
              </div>
            </div>

            {showAdd && (
              <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" />
                  <input
                    value={searchAdd}
                    onChange={(e) => setSearchAdd(e.target.value)}
                    placeholder="Rechercher un élève..."
                    className="w-full border border-[#e5e5e5] rounded-[8px] pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] bg-white placeholder:text-[#aaaaaa]"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {eligibles.slice(0, 20).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => ajouterPresence(e.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-left hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: "var(--color-primary)" }}>
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">{e.prenom} {e.nom}</p>
                      </div>
                      <CeintureBadge ceinture={e.ceinture} barrettes={e.barrettes} size="sm" />
                      <Plus size={14} className="text-[var(--color-primary)] flex-shrink-0" />
                    </button>
                  ))}
                  {eligibles.length === 0 && (
                    <p className="text-xs text-[#aaaaaa] text-center py-2">Aucun élève disponible</p>
                  )}
                </div>
              </div>
            )}

            <div className="divide-y divide-[#f7f7f7]">
              {presences.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    {p.eleve.prenom[0]}{p.eleve.nom[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a]">{p.eleve.prenom} {p.eleve.nom}</p>
                  </div>
                  <CeintureBadge ceinture={p.eleve.ceinture} barrettes={p.eleve.barrettes} size="sm" />
                  <button
                    onClick={() => supprimerPresence(p.eleveId)}
                    className="text-[#cccccc] hover:text-red-500 transition-colors p-1 flex-shrink-0"
                    title="Retirer la présence"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {presences.length === 0 && !showAdd && (
                <div className="py-12 text-center">
                  <Users size={32} className="mx-auto mb-3 text-[#e5e5e5]" />
                  <p className="text-sm text-[#aaaaaa]">Aucune présence enregistrée</p>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="mt-3 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    Ajouter manuellement
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-[12px] shadow-sm flex items-center justify-center py-16">
            <div className="text-center">
              <Users size={40} className="mx-auto mb-3 text-[#e5e5e5]" />
              <p className="text-sm text-[#aaaaaa]">Sélectionne un cours pour voir les présences</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
