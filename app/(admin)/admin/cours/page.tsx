"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, X, Trash2, ChevronDown, ChevronUp, Pencil, BookOpen, Search } from "lucide-react";

interface SeanceTechnique {
  id: string;
  date: string;
  type: string;
  techniques: string;
  notes: string | null;
  createdAt: string;
}

const TYPES: Record<string, string> = {
  GI:          "Gi",
  NO_GI:       "No-Gi",
  KIDS:        "Enfants",
  COMPETITION: "Compétition",
  OPEN_MAT:    "Open Mat",
};

const TYPE_COLORS: Record<string, string> = {
  GI:          "bg-blue-100 text-blue-700",
  NO_GI:       "bg-purple-100 text-purple-700",
  KIDS:        "bg-green-100 text-green-700",
  COMPETITION: "bg-red-100 text-red-700",
  OPEN_MAT:    "bg-gray-100 text-gray-600",
};

function getSaisonActuelle(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function getSaisons(): string[] {
  const current = getSaisonActuelle();
  const [y1] = current.split("-").map(Number);
  return [`${y1 - 1}-${y1}`, current, `${y1 + 1}-${y1 + 2}`];
}

const inputClass = "w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]";

export default function CoursPage() {
  const [saison, setSaison] = useState(getSaisonActuelle());
  const [seances, setSeances] = useState<SeanceTechnique[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formType, setFormType] = useState("GI");
  const [formTechniques, setFormTechniques] = useState<string[]>([""]);
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const saisons = getSaisons();
  const saisonActuelle = getSaisonActuelle();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/seances?saison=${saison}`)
      .then((r) => r.json())
      .then((data) => { setSeances(data); setLoading(false); });
  }, [saison]);

  useEffect(() => { load(); }, [load]);

  const ouvrirFormulaire = (seance?: SeanceTechnique) => {
    if (seance) {
      setEditId(seance.id);
      setFormDate(seance.date.split("T")[0]);
      setFormType(seance.type);
      setFormTechniques(JSON.parse(seance.techniques));
      setFormNotes(seance.notes ?? "");
    } else {
      setEditId(null);
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormType("GI");
      setFormTechniques([""]);
      setFormNotes("");
    }
    setShowForm(true);
  };

  const fermerFormulaire = () => {
    setShowForm(false);
    setEditId(null);
  };

  const sauvegarder = async (e: React.FormEvent) => {
    e.preventDefault();
    const techniques = formTechniques.map((t) => t.trim()).filter(Boolean);
    if (!techniques.length) return;
    setSaving(true);

    if (editId) {
      await fetch(`/api/seances/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formDate, type: formType, techniques, notes: formNotes }),
      });
    } else {
      await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formDate, type: formType, techniques, notes: formNotes }),
      });
    }

    setSaving(false);
    fermerFormulaire();
    load();
  };

  const supprimer = async (id: string) => {
    await fetch(`/api/seances/${id}`, { method: "DELETE" });
    setSeances((prev) => prev.filter((s) => s.id !== id));
  };

  const filtered = seances.filter((s) => {
    if (filtreType && s.type !== filtreType) return false;
    if (search) {
      const q = search.toLowerCase();
      const techs = JSON.parse(s.techniques) as string[];
      return techs.some((t) => t.toLowerCase().includes(q)) || (s.notes ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalTechniques = seances.reduce((acc, s) => {
    try { return acc + (JSON.parse(s.techniques) as string[]).length; } catch { return acc; }
  }, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Suivi des cours</h1>
        <button
          onClick={() => ouvrirFormulaire()}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Ajouter une séance</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Saison tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {saisons.map((s) => (
          <button
            key={s}
            onClick={() => setSaison(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              saison === s
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white shadow-sm text-[#666666] hover:bg-[#f5f5f5]"
            }`}
          >
            {s}
            {s === saisonActuelle && saison !== s && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {seances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Séances</p>
            <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{seances.length}</p>
          </div>
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Techniques enseignées</p>
            <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{totalTechniques}</p>
          </div>
          <div className="bg-white rounded-[12px] shadow-sm p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-[#666666]">Types de cours</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(
                seances.reduce((acc, s) => ({ ...acc, [s.type]: (acc[s.type] ?? 0) + 1 }), {} as Record<string, number>)
              ).map(([type, count]) => (
                <span key={type} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600"}`}>
                  {TYPES[type] ?? type} {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une technique…"
            className="w-full border border-[#e5e5e5] rounded-[8px] pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[#aaaaaa]"
          />
        </div>
        <select
          value={filtreType}
          onChange={(e) => setFiltreType(e.target.value)}
          className="border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="bg-white rounded-[12px] shadow-sm p-12 text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-primary-subtle)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[12px] shadow-sm p-12 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-[#e5e5e5]" />
          <p className="text-sm text-[#666666]">Aucune séance pour la saison {saison}</p>
          <button onClick={() => ouvrirFormulaire()} className="mt-3 text-sm text-[var(--color-primary)] hover:underline">
            Ajouter la première séance →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const techs = JSON.parse(s.techniques) as string[];
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} className="bg-white rounded-[12px] shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1a1a1a]">
                        {format(new Date(s.date), "d MMMM yyyy", { locale: fr })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[s.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {TYPES[s.type] ?? s.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#999999] mt-0.5 truncate">
                      {techs.length} technique{techs.length > 1 ? "s" : ""} · {techs.slice(0, 3).join(", ")}{techs.length > 3 ? "…" : ""}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-[#cccccc] flex-shrink-0" /> : <ChevronDown size={16} className="text-[#cccccc] flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 border-t border-[#f5f5f5]">
                    <ul className="space-y-1.5 mt-3 mb-3">
                      {techs.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#1a1a1a]">
                          <span className="w-5 h-5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {t}
                        </li>
                      ))}
                    </ul>
                    {s.notes && (
                      <p className="text-xs text-[#666666] bg-[#f9f9f9] rounded-[8px] px-3 py-2 mb-3 italic">
                        {s.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => ouvrirFormulaire(s)}
                        className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#1a1a1a] transition-colors"
                      >
                        <Pencil size={13} />
                        Modifier
                      </button>
                      <button
                        onClick={() => supprimer(s.id)}
                        className="flex items-center gap-1.5 text-xs text-[#cccccc] hover:text-[#ef4444] transition-colors"
                      >
                        <Trash2 size={13} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={fermerFormulaire}>
          <div
            className="bg-white rounded-t-[20px] sm:rounded-[16px] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#f0f0f0] sticky top-0 bg-white z-10">
              <h2 className="font-bold text-[#1a1a1a]">
                {editId ? "Modifier la séance" : "Nouvelle séance"}
              </h2>
              <button onClick={fermerFormulaire} className="text-[#999999] hover:text-[#1a1a1a] p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={sauvegarder} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1.5">Type de cours</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className={inputClass}
                  >
                    {Object.entries(TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#666666]">
                    Techniques enseignées
                  </label>
                  <span className="text-xs text-[#999999]">
                    {formTechniques.filter(Boolean).length} technique{formTechniques.filter(Boolean).length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {formTechniques.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#f0f0f0] text-[#999999] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <input
                        value={t}
                        onChange={(e) => setFormTechniques((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                        placeholder={`Technique ${i + 1}…`}
                        className={inputClass + " placeholder:text-[#aaaaaa]"}
                      />
                      {formTechniques.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormTechniques((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-[#cccccc] hover:text-[#ef4444] transition-colors flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFormTechniques((prev) => [...prev, ""])}
                  className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] mt-2 transition-colors"
                >
                  <Plus size={14} />
                  Ajouter une technique
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1.5">
                  Notes (facultatif)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Contexte, observations, niveau du groupe…"
                  className={inputClass + " resize-none placeholder:text-[#aaaaaa]"}
                />
              </div>

              <button
                type="submit"
                disabled={saving || !formTechniques.filter(Boolean).length}
                className="w-full bg-[var(--color-primary)] text-white rounded-[8px] py-3 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
              >
                {saving ? "Enregistrement…" : editId ? "Enregistrer les modifications" : "Ajouter la séance"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
