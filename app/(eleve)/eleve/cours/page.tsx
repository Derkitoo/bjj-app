"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface SeanceTechnique {
  id: string;
  date: string;
  type: string;
  public: string;
  techniques: string;
  notes: string | null;
}

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

export default function CoursElevePage() {
  const [saison, setSaison] = useState(getSaisonActuelle());
  const [seances, setSeances] = useState<SeanceTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const saisons = getSaisons();
  const saisonActuelle = getSaisonActuelle();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/seances?saison=${saison}`)
      .then((r) => r.json())
      .then((data) => { setSeances(data); setLoading(false); });
  }, [saison]);

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
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--c-text-1)" }}>
          <BookOpen size={22} style={{ color: "var(--color-primary)" }} />
          Techniques du cours
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-3)" }}>
          Retrouve toutes les techniques enseignées chaque séance
        </p>
      </div>

      {/* Saison tabs */}
      <div className="flex gap-2 flex-wrap">
        {saisons.map((s) => (
          <button key={s} onClick={() => setSaison(s)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={saison === s
              ? { backgroundColor: "var(--color-primary)", color: "white" }
              : { backgroundColor: "var(--c-card)", color: "var(--c-text-2)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }
            }>
            {s}
            {s === saisonActuelle && saison !== s && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-400 inline-block align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      {seances.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[12px] p-4" style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--c-text-3)" }}>Séances</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--c-text-1)" }}>{seances.length}</p>
          </div>
          <div className="rounded-[12px] p-4" style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--c-text-3)" }}>Techniques vues</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--c-text-1)" }}>{totalTechniques}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-3)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une technique…"
            className="w-full rounded-[8px] pl-9 pr-3 py-2 text-sm focus:outline-none"
            style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-card)", color: "var(--c-text-1)" }}
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--c-text-3)" }} />
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            className="rounded-[8px] pl-8 pr-3 py-2 text-sm focus:outline-none appearance-none"
            style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-card)", color: "var(--c-text-1)" }}
          >
            <option value="">Tous</option>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
            {search || filtreType ? "Aucun résultat pour cette recherche." : `Aucune séance enregistrée pour la saison ${saison}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const techs = JSON.parse(s.techniques) as string[];
            const isOpen = expanded === s.id;
            const colors = TYPE_COLORS[s.type] ?? TYPE_COLORS.OPEN_MAT;
            return (
              <div key={s.id} className="rounded-[12px] overflow-hidden"
                style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                  style={{ backgroundColor: isOpen ? "var(--c-hover)" : undefined }}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold capitalize" style={{ color: "var(--c-text-1)" }}>
                        {format(new Date(s.date), "d MMMM yyyy", { locale: fr })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                        {TYPES[s.type] ?? s.type}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--c-text-3)" }}>
                      {techs.length} technique{techs.length > 1 ? "s" : ""} · {techs.slice(0, 3).join(", ")}{techs.length > 3 ? "…" : ""}
                    </p>
                  </div>
                  {isOpen
                    ? <ChevronUp size={16} className="flex-shrink-0" style={{ color: "var(--c-text-3)" }} />
                    : <ChevronDown size={16} className="flex-shrink-0" style={{ color: "var(--c-text-3)" }} />
                  }
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--c-border)" }}>
                    <ul className="space-y-2 mt-3">
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
                      <p className="text-xs mt-3 pt-3 border-t italic"
                        style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
                        {s.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
