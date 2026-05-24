"use client";

import { useState, useEffect } from "react";
import { Plus, X, Clock, Trash2 } from "lucide-react";

interface Cours {
  id: string;
  type: string;
  jour: number;
  heureDebut: string;
  duree: number;
  titre: string | null;
  recurrent: boolean;
  annule: boolean;
}

const JOURS_ORDERED = [1, 2, 3, 4, 5, 6, 0];
const JOURS_LABELS: Record<number, string> = { 0: "Dimanche", 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi" };
const JOURS_SHORT: Record<number, string> = { 0: "Dim", 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam" };
const TYPES: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Kids", COMPETITION: "Compétition", OPEN_MAT: "Open Mat" };

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  GI:          { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", dot: "#3b82f6" },
  NO_GI:       { bg: "#ede9fe", border: "#c4b5fd", text: "#6d28d9", dot: "#8b5cf6" },
  KIDS:        { bg: "#dcfce7", border: "#86efac", text: "#166534", dot: "#22c55e" },
  COMPETITION: { bg: "#fee2e2", border: "#fca5a5", text: "#dc2626", dot: "#ef4444" },
  OPEN_MAT:    { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569", dot: "#94a3b8" },
};

const HOUR_START = 7;
const HOUR_END = 22;
const PX_PER_HOUR = 64;
const GRID_HEIGHT = (HOUR_END - HOUR_START) * PX_PER_HOUR;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

const timeToY = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h - HOUR_START) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
};

const formatDuree = (min: number) => {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h}h`;
};

export default function PlanningPage() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "GI", jour: 1, heureDebut: "19:00", duree: 90, titre: "", recurrent: true });

  useEffect(() => {
    fetch("/api/cours").then((r) => r.json()).then(setCours);
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({
      ...f,
      [field]: field === "jour" || field === "duree"
        ? Number(e.target.value)
        : field === "recurrent"
        ? (e.target as HTMLInputElement).checked
        : e.target.value,
    }));

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/cours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCours((prev) => [...prev, data]);
    setShowForm(false);
    setForm({ type: "GI", jour: 1, heureDebut: "19:00", duree: 90, titre: "", recurrent: true });
  };

  const supprimer = async (id: string) => {
    await fetch(`/api/cours/${id}`, { method: "DELETE" });
    setCours((prev) => prev.filter((c) => c.id !== id));
  };

  const totalCours = cours.filter((c) => !c.annule).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Planning</h1>
          <p className="text-sm text-[#666666] mt-0.5">
            {totalCours} cours par semaine
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <Plus size={16} />
          Ajouter un cours
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
        {Object.entries(TYPES).map(([key, label]) => {
          const c = TYPE_COLORS[key];
          const count = cours.filter((co) => co.type === key && !co.annule).length;
          if (count === 0) return null;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-[#666666]">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
              {label} <span className="text-[#aaaaaa]">({count})</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
        <div
          className="grid border-b border-[#e5e5e5]"
          style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}
        >
          <div className="border-r border-[#e5e5e5]" />
          {JOURS_ORDERED.map((jour) => {
            const n = cours.filter((c) => c.jour === jour && !c.annule).length;
            return (
              <div key={jour} className="text-center py-3 border-r border-[#e5e5e5] last:border-r-0">
                <p className="text-xs font-semibold text-[#1a1a1a] hidden sm:block">{JOURS_LABELS[jour]}</p>
                <p className="text-xs font-semibold text-[#1a1a1a] sm:hidden">{JOURS_SHORT[jour]}</p>
                {n > 0 && (
                  <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                    {n}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "580px" }}>
          <div
            className="relative grid"
            style={{ height: `${GRID_HEIGHT}px`, gridTemplateColumns: "48px repeat(7, 1fr)" }}
          >
            <div className="border-r border-[#e5e5e5] relative">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-0 left-0 flex justify-end pr-2"
                  style={{ top: `${(h - HOUR_START) * PX_PER_HOUR - 7}px` }}
                >
                  <span className="text-[10px] text-[#bbbbbb] font-medium tabular-nums">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {JOURS_ORDERED.map((jour) => (
              <div key={jour} className="relative border-r border-[#e5e5e5] last:border-r-0">
                {HOURS.slice(0, -1).map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-[#f0f0f0]"
                    style={{ top: `${(h - HOUR_START) * PX_PER_HOUR}px` }}
                  />
                ))}
                {HOURS.slice(0, -1).map((h) => (
                  <div
                    key={`${h}-half`}
                    className="absolute left-0 right-0 border-t border-[#f7f7f7]"
                    style={{ top: `${(h - HOUR_START) * PX_PER_HOUR + PX_PER_HOUR / 2}px`, borderStyle: "dashed" }}
                  />
                ))}

                {cours
                  .filter((c) => c.jour === jour && !c.annule)
                  .map((c) => {
                    const top = timeToY(c.heureDebut);
                    const height = Math.max((c.duree / 60) * PX_PER_HOUR, 22);
                    const s = TYPE_COLORS[c.type] || TYPE_COLORS.OPEN_MAT;
                    return (
                      <div
                        key={c.id}
                        className="absolute left-1 right-1 rounded-[6px] px-1.5 py-1 border group cursor-default overflow-hidden"
                        style={{ top: `${top}px`, height: `${height}px`, backgroundColor: s.bg, borderColor: s.border }}
                      >
                        <div className="flex items-start justify-between gap-0.5 h-full">
                          <div className="min-w-0 overflow-hidden">
                            <p
                              className="text-[11px] font-bold leading-tight truncate"
                              style={{ color: s.text }}
                            >
                              {TYPES[c.type]}
                            </p>
                            {height >= 38 && (
                              <p
                                className="text-[10px] mt-0.5 flex items-center gap-0.5 leading-tight"
                                style={{ color: s.text, opacity: 0.7 }}
                              >
                                <Clock size={9} className="flex-shrink-0" />
                                {c.heureDebut} · {formatDuree(c.duree)}
                              </p>
                            )}
                            {c.titre && height >= 56 && (
                              <p
                                className="text-[10px] mt-0.5 truncate"
                                style={{ color: s.text, opacity: 0.6 }}
                              >
                                {c.titre}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => supprimer(c.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded p-0.5 hover:bg-black/10 mt-0.5"
                            style={{ color: s.text }}
                            title="Supprimer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-[12px] p-6 w-full max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#1a1a1a]">Nouveau cours</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#666666] hover:text-[#1a1a1a] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={creer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={set("type")}
                    className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {Object.entries(TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Jour</label>
                  <select
                    value={form.jour}
                    onChange={set("jour")}
                    className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {JOURS_ORDERED.map((j) => (
                      <option key={j} value={j}>{JOURS_LABELS[j]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={form.heureDebut}
                    onChange={set("heureDebut")}
                    className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Durée (minutes)</label>
                  <input
                    type="number"
                    value={form.duree}
                    onChange={set("duree")}
                    min={15}
                    step={15}
                    className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Titre (facultatif)</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={set("titre")}
                  placeholder="Ex : Cours débutants"
                  className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[#aaaaaa]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurrent"
                  checked={form.recurrent}
                  onChange={set("recurrent")}
                  className="accent-[var(--color-primary)]"
                />
                <label htmlFor="recurrent" className="text-sm text-[#1a1a1a]">Cours récurrent (toutes les semaines)</label>
              </div>

              <div
                className="h-10 rounded-[8px] flex items-center justify-center border-2 transition-colors"
                style={{
                  backgroundColor: TYPE_COLORS[form.type]?.bg,
                  borderColor: TYPE_COLORS[form.type]?.border,
                  color: TYPE_COLORS[form.type]?.text,
                }}
              >
                <span className="text-xs font-semibold">
                  {JOURS_LABELS[form.jour]} · {TYPES[form.type]} · {form.heureDebut} · {formatDuree(form.duree)}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                Créer le cours
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
