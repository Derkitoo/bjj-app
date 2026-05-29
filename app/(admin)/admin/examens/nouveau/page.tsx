"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Search } from "lucide-react";

const CEINTURES = [
  { v: "BLANCHE", label: "⬜ Blanche", color: "#d1d5db" },
  { v: "BLEUE",   label: "🔵 Bleue",   color: "#3b82f6" },
  { v: "VIOLETTE",label: "🟣 Violette",color: "#8b5cf6" },
  { v: "MARRON",  label: "🟤 Marron",  color: "#92400e" },
  { v: "NOIRE",   label: "⚫ Noire",   color: "#1a1a1a" },
];
const SECTIONS = [
  { v: "GI",    label: "Gi" },
  { v: "NO_GI", label: "No-Gi" },
  { v: "KIDS",  label: "Enfants" },
];

interface Eleve { id: string; nom: string; prenom: string; ceinture: string }

const inputClass = "w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]";

export default function NouvelExamenPage() {
  const router = useRouter();
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    ceintureCible: "BLEUE",
    section: "GI",
    notes: "",
  });
  const [criteres, setCriteres] = useState<string[]>([""]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/eleves?actif=true").then((r) => r.json()).then(setEleves);
  }, []);

  const filteredEleves = eleves.filter((e) =>
    `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  const addCritere = () => setCriteres((c) => [...c, ""]);
  const removeCritere = (i: number) => setCriteres((c) => c.filter((_, idx) => idx !== i));
  const setCritere = (i: number, v: string) => setCriteres((c) => c.map((x, idx) => idx === i ? v : x));

  const toggleEleve = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const criteresClean = criteres.map((c) => c.trim()).filter(Boolean);
    if (!criteresClean.length) { setError("Ajoute au moins un critère"); return; }
    if (!selectedIds.size) { setError("Sélectionne au moins un élève"); return; }

    setLoading(true);
    const res = await fetch("/api/examens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        criteres: criteresClean,
        eleveIds: Array.from(selectedIds),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur");
      return;
    }
    const data = await res.json();
    router.push(`/admin/examens/${data.id}`);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/examens" className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Créer un examen</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Colonne gauche */}
          <div className="space-y-4">

            {/* Infos session */}
            <div className="bg-white rounded-[16px] shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-[#1a1a1a]">Session</h2>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Date</label>
                <input type="date" required value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Ceinture cible</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {CEINTURES.map(({ v, label }) => (
                    <button key={v} type="button"
                      onClick={() => setForm((f) => ({ ...f, ceintureCible: v }))}
                      className={`py-2 px-1 rounded-[8px] border-2 text-center text-xs font-medium transition-colors ${
                        form.ceintureCible === v
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                          : "border-[#e5e5e5] text-[#666666] hover:border-[#cccccc]"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Section</label>
                <div className="flex gap-2">
                  {SECTIONS.map(({ v, label }) => (
                    <button key={v} type="button"
                      onClick={() => setForm((f) => ({ ...f, section: v }))}
                      className={`flex-1 py-2 rounded-[8px] border-2 text-sm font-medium transition-colors ${
                        form.section === v
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                          : "border-[#e5e5e5] text-[#666666] hover:border-[#cccccc]"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Notes (optionnel)</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2} className={inputClass + " resize-none"} placeholder="Informations complémentaires…" />
              </div>
            </div>

            {/* Critères */}
            <div className="bg-white rounded-[16px] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#1a1a1a]">Critères d&apos;évaluation</h2>
                <button type="button" onClick={addCritere}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] font-medium hover:underline">
                  <Plus size={13} /> Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {criteres.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[#aaaaaa] w-5 text-right flex-shrink-0">{i + 1}.</span>
                    <input
                      value={c}
                      onChange={(e) => setCritere(i, e.target.value)}
                      placeholder={`Ex : Uchi mata, Défense de garde…`}
                      className={inputClass}
                    />
                    {criteres.length > 1 && (
                      <button type="button" onClick={() => removeCritere(i)}
                        className="text-[#cccccc] hover:text-red-400 flex-shrink-0 transition-colors">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#aaaaaa] mt-3">
                {criteres.filter((c) => c.trim()).length} critère{criteres.filter((c) => c.trim()).length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Colonne droite — Sélection élèves */}
          <div className="bg-white rounded-[16px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1a1a1a]">Participants</h2>
              <span className="text-xs text-[#999999]">{selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}</span>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un élève…"
                className="w-full border border-[#e5e5e5] rounded-[8px] pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredEleves.map((e) => {
                const selected = selectedIds.has(e.id);
                return (
                  <label key={e.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer border transition-colors ${
                      selected
                        ? "bg-[var(--color-primary-subtle)] border-[var(--color-primary)]"
                        : "border-transparent hover:bg-[#f9f9f9]"
                    }`}>
                    <input type="checkbox" className="sr-only" checked={selected} onChange={() => toggleEleve(e.id)} />
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      selected ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[#e5e5e5]"
                    }`}>
                      {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${selected ? "text-[var(--color-primary)]" : "text-[#1a1a1a]"}`}>
                        {e.prenom} {e.nom}
                      </p>
                    </div>
                  </label>
                );
              })}
              {filteredEleves.length === 0 && (
                <p className="text-xs text-[#aaaaaa] text-center py-4">Aucun élève trouvé</p>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        <div className="flex items-center gap-3 mt-6">
          <button type="submit" disabled={loading}
            className="bg-[var(--color-primary)] text-white rounded-[8px] px-6 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {loading ? "Création…" : "Créer l'examen"}
          </button>
          <Link href="/admin/examens" className="text-sm text-[#666666] hover:text-[#1a1a1a]">Annuler</Link>
        </div>
      </form>
    </div>
  );
}
