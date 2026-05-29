"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, X, Trash2, ChevronDown, ChevronUp, Pencil, BookOpen, Search, Filter } from "lucide-react";

interface SeanceTechnique {
  id: string;
  date: string;
  type: string;
  public: string;
  techniques: string;
  notes: string | null;
  createdAt: string;
}

const PUBLIC_OPTIONS: Record<string, { label: string; bg: string; text: string }> = {
  ADULTES: { label: "Adultes",  bg: "bg-orange-50",  text: "text-orange-700" },
  KIDS:    { label: "Kids",     bg: "bg-teal-50",    text: "text-teal-700" },
  TOUS:    { label: "Tous",     bg: "bg-gray-100",   text: "text-gray-600" },
};

const TYPES: Record<string, string> = {
  GI: "Gi", NO_GI: "No-Gi", KIDS: "Enfants", COMPETITION: "Compétition", OPEN_MAT: "Open Mat",
};
const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  GI:          { bg: "bg-blue-50",   text: "text-blue-700",   dot: "#3b82f6" },
  NO_GI:       { bg: "bg-purple-50", text: "text-purple-700", dot: "#8b5cf6" },
  KIDS:        { bg: "bg-green-50",  text: "text-green-700",  dot: "#22c55e" },
  COMPETITION: { bg: "bg-red-50",    text: "text-red-700",    dot: "#ef4444" },
  OPEN_MAT:    { bg: "bg-gray-100",  text: "text-gray-600",   dot: "#9ca3af" },
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

const inputClass = "w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] bg-white";

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
  const [formPublic, setFormPublic] = useState("ADULTES");
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
      setFormPublic(seance.public ?? "ADULTES");
      setFormTechniques(JSON.parse(seance.techniques));
      setFormNotes(seance.notes ?? "");
    } else {
      setEditId(null);
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormType("GI");
      setFormPublic("ADULTES");
      setFormTechniques([""]);
      setFormNotes("");
    }
    setShowForm(true);
  };

  const fermerFormulaire = () => { setShowForm(false); setEditId(null); };

  const sauvegarder = async (e: React.FormEvent) => {
    e.preventDefault();
    const techniques = formTechniques.map((t) => t.trim()).filter(Boolean);
    if (!techniques.length) return;
    setSaving(true);
    if (editId) {
      await fetch(`/api/seances/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formDate, type: formType, public: formPublic, techniques, notes: formNotes }),
      });
    } else {
      await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formDate, type: formType, public: formPublic, techniques, notes: formNotes }),
      });
    }
    setSaving(false);
    fermerFormulaire();
    load();
  };

  const supprimer = async (id: string) => {
    const res = await fetch(`/api/seances/${id}`, { method: "DELETE" });
    if (res.ok) setSeances((prev) => prev.filter((s) => s.id !== id));
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

  const typeCounts = seances.reduce((acc, s) => ({ ...acc, [s.type]: (acc[s.type] ?? 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--c-text-1)" }}>Suivi des cours</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--c-text-3)" }}>Historique des techniques enseignées</p>
        </div>
        <button
          onClick={() => ouvrirFormulaire()}
          className="flex items-center gap-2 text-white rounded-[8px] px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nouvelle séance</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Saison tabs */}
      <div className="flex gap-2 flex-wrap">
        {saisons.map((s) => (
          <button key={s} onClick={() => setSaison(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              saison === s
                ? "text-white shadow-sm"
                : "hover:opacity-80"
            }`}
            style={saison === s
              ? { backgroundColor: "var(--color-primary)" }
              : { backgroundColor: "var(--c-card)", color: "var(--c-text-2)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }
            }
          >
            {s}
            {s === saisonActuelle && saison !== s && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-400 inline-block align-middle" />
            )}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">
        {/* Main list */}
        <div className="space-y-4">
          {/* Filtres */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-3)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une technique…"
                className="w-full rounded-[8px] pl-9 pr-3 py-2 text-sm focus:outline-none"
                style={{
                  border: "1px solid var(--c-border)",
                  backgroundColor: "var(--c-card)",
                  color: "var(--c-text-1)",
                }}
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--c-text-3)" }} />
              <select
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value)}
                className="rounded-[8px] pl-8 pr-3 py-2 text-sm focus:outline-none appearance-none"
                style={{
                  border: "1px solid var(--c-border)",
                  backgroundColor: "var(--c-card)",
                  color: "var(--c-text-1)",
                }}
              >
                <option value="">Tous</option>
                {Object.entries(TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Liste */}
          {loading ? (
            <div className="rounded-[16px] p-12 text-center" style={{ backgroundColor: "var(--c-card)" }}>
              <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: "var(--color-primary-subtle)", borderTopColor: "var(--color-primary)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[16px] p-12 text-center" style={{ backgroundColor: "var(--c-card)" }}>
              <BookOpen size={40} className="mx-auto mb-3" style={{ color: "var(--c-border)" }} />
              <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
                {search || filtreType ? "Aucun résultat pour cette recherche." : `Aucune séance pour la saison ${saison}.`}
              </p>
              {!search && !filtreType && (
                <button onClick={() => ouvrirFormulaire()} className="mt-3 text-sm hover:underline font-medium"
                  style={{ color: "var(--color-primary)" }}>
                  Ajouter la première séance →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => {
                const techs = JSON.parse(s.techniques) as string[];
                const isOpen = expanded === s.id;
                const colors = TYPE_COLORS[s.type] ?? TYPE_COLORS.OPEN_MAT;
                return (
                  <div key={s.id} className="rounded-[12px] overflow-hidden transition-shadow"
                    style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                      style={{ backgroundColor: isOpen ? "var(--c-hover)" : undefined }}
                    >
                      {/* Color dot */}
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold capitalize" style={{ color: "var(--c-text-1)" }}>
                            {format(new Date(s.date), "d MMMM yyyy", { locale: fr })}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                            {TYPES[s.type] ?? s.type}
                          </span>
                          {(() => { const p = PUBLIC_OPTIONS[s.public]; return p ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.bg} ${p.text}`}>{p.label}</span>
                          ) : null; })()}
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--c-text-3)" }}>
                          {techs.length} technique{techs.length > 1 ? "s" : ""} · {techs.slice(0, 3).join(", ")}{techs.length > 3 ? "…" : ""}
                        </p>
                      </div>
                      {isOpen
                        ? <ChevronUp size={16} className="flex-shrink-0" style={{ color: "var(--c-text-3)" }} />
                        : <ChevronDown size={16} className="flex-shrink-0" style={{ color: "var(--c-text-3)" }} />}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 border-t" style={{ borderColor: "var(--c-border)" }}>
                        <ul className="space-y-2 mt-3 mb-3">
                          {techs.map((t, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--c-text-1)" }}>
                              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                                {i + 1}
                              </span>
                              {t}
                            </li>
                          ))}
                        </ul>
                        {s.notes && (
                          <p className="text-xs rounded-[8px] px-3 py-2 mb-3 italic"
                            style={{ backgroundColor: "var(--c-hover)", color: "var(--c-text-2)" }}>
                            {s.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 pt-1">
                          <button onClick={() => ouvrirFormulaire(s)}
                            className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                            style={{ color: "var(--c-text-2)" }}>
                            <Pencil size={13} /> Modifier
                          </button>
                          <button onClick={() => supprimer(s.id)}
                            className="flex items-center gap-1.5 text-xs transition-colors hover:text-red-500"
                            style={{ color: "var(--c-text-3)" }}>
                            <Trash2 size={13} /> Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar stats (desktop only) */}
        <div className="hidden lg:block space-y-4 mt-[52px]">
          {/* KPIs */}
          <div className="rounded-[16px] p-5 space-y-4"
            style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--c-text-3)" }}>
              Saison {saison}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[12px] p-3" style={{ backgroundColor: "var(--color-primary-subtle)" }}>
                <p className="text-xs" style={{ color: "var(--color-primary)" }}>Séances</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--color-primary)" }}>{seances.length}</p>
              </div>
              <div className="rounded-[12px] p-3" style={{ backgroundColor: "var(--c-hover)" }}>
                <p className="text-xs" style={{ color: "var(--c-text-3)" }}>Techniques</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--c-text-1)" }}>{totalTechniques}</p>
              </div>
            </div>
          </div>

          {/* Répartition par type */}
          {seances.length > 0 && (
            <div className="rounded-[16px] p-5"
              style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--c-text-3)" }}>
                Par type
              </h3>
              <div className="space-y-2.5">
                {Object.entries(TYPES).filter(([k]) => typeCounts[k]).map(([k, v]) => {
                  const count = typeCounts[k] ?? 0;
                  const pct = seances.length > 0 ? Math.round((count / seances.length) * 100) : 0;
                  const colors = TYPE_COLORS[k];
                  return (
                    <div key={k}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot }} />
                          <span className="text-xs" style={{ color: "var(--c-text-2)" }}>{v}</span>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: "var(--c-text-1)" }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--c-border)" }}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: colors.dot }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtrage actif info */}
          {(search || filtreType) && (
            <div className="rounded-[12px] px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: "var(--color-primary-subtle)" }}>
              <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </span>
              <button onClick={() => { setSearch(""); setFiltreType(""); }}
                className="text-xs hover:underline" style={{ color: "var(--color-primary)" }}>
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats mobile (sous la liste) */}
      {seances.length > 0 && (
        <div className="lg:hidden grid grid-cols-2 gap-3">
          <div className="rounded-[12px] p-4" style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p className="text-xs" style={{ color: "var(--c-text-3)" }}>Séances</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--c-text-1)" }}>{seances.length}</p>
          </div>
          <div className="rounded-[12px] p-4" style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p className="text-xs" style={{ color: "var(--c-text-3)" }}>Techniques</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--c-text-1)" }}>{totalTechniques}</p>
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={fermerFormulaire}>
          <div className="rounded-t-[20px] sm:rounded-[16px] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--c-card)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-card)" }}>
              <h2 className="font-bold" style={{ color: "var(--c-text-1)" }}>
                {editId ? "Modifier la séance" : "Nouvelle séance"}
              </h2>
              <button onClick={fermerFormulaire} className="p-1 rounded-full hover:opacity-70">
                <X size={18} style={{ color: "var(--c-text-2)" }} />
              </button>
            </div>

            <form onSubmit={sauvegarder} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-2)" }}>Date</label>
                  <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-2)" }}>Type</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)} className={inputClass}>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-2)" }}>Destiné à</label>
                <div className="flex gap-2">
                  {Object.entries(PUBLIC_OPTIONS).map(([k, v]) => (
                    <button key={k} type="button"
                      onClick={() => setFormPublic(k)}
                      className={`flex-1 py-2 rounded-[8px] text-sm font-medium border transition-all ${
                        formPublic === k ? `${v.bg} ${v.text} border-current` : "border-[#e5e5e5] text-gray-500"
                      }`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Techniques enseignées</label>
                  <span className="text-xs" style={{ color: "var(--c-text-3)" }}>
                    {formTechniques.filter(Boolean).length} ajoutée{formTechniques.filter(Boolean).length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {formTechniques.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "var(--c-hover)", color: "var(--c-text-3)" }}>
                        {i + 1}
                      </span>
                      <input
                        value={t}
                        onChange={(e) => setFormTechniques((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                        placeholder={`Technique ${i + 1}…`}
                        className={inputClass}
                      />
                      {formTechniques.length > 1 && (
                        <button type="button"
                          onClick={() => setFormTechniques((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setFormTechniques((prev) => [...prev, ""])}
                  className="flex items-center gap-1.5 text-sm mt-2 font-medium transition-colors hover:opacity-70"
                  style={{ color: "var(--color-primary)" }}>
                  <Plus size={14} /> Ajouter une technique
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-2)" }}>Notes (facultatif)</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  rows={2} placeholder="Contexte, observations, niveau du groupe…"
                  className={inputClass + " resize-none"} />
              </div>

              <button type="submit"
                disabled={saving || !formTechniques.filter(Boolean).length}
                className="w-full text-white rounded-[8px] py-3 text-sm font-medium disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {saving ? "Enregistrement…" : editId ? "Enregistrer les modifications" : "Ajouter la séance"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
