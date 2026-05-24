"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, CheckSquare, Award, Newspaper, TrendingUp, CreditCard, Settings, X, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CEINTURE_COLORS: Record<string, { bg: string; border?: string }> = {
  BLANCHE:  { bg: "#f3f4f6", border: "#d1d5db" },
  BLEUE:    { bg: "#1d4ed8" },
  VIOLETTE: { bg: "#7c3aed" },
  MARRON:   { bg: "#92400e" },
  NOIRE:    { bg: "#111111" },
};

const WIDGETS_CONFIG = [
  { id: "kpi_presences",  label: "KPI — Présents aujourd'hui",    group: "kpis" },
  { id: "kpi_eleves",     label: "KPI — Élèves actifs",           group: "kpis" },
  { id: "kpi_taux",       label: "KPI — Taux de présence",        group: "kpis" },
  { id: "kpi_impayes",    label: "KPI — Impayés ce mois",         group: "kpis" },
  { id: "graph_presences",label: "Graphique présences (6 mois)",  group: "stats" },
  { id: "distrib_ceintures", label: "Répartition par ceinture",   group: "stats" },
  { id: "top5",           label: "Top 5 présences ce mois",       group: "stats" },
  { id: "eligibles",      label: "Éligibles à promotion",         group: "stats" },
  { id: "last_post",      label: "Dernière actualité",            group: "stats" },
];

const DEFAULT_VISIBLE = Object.fromEntries(WIDGETS_CONFIG.map((w) => [w.id, true]));
const LS_KEY = "dashboard_widgets";

interface Stats {
  kpis: { totalEleves: number; presencesAujourdhui: number; tauxPresence: number; paiementsImpayesCeMois: number; nbFideles: number; presencesMois: number };
  graphPresences: { label: string; count: number }[];
  distribCeinture: Record<string, number>;
  eligibles: { id: string; prenom: string; nom: string; ceinture: string; nextBelt: string }[];
  top5: { id: string; prenom: string; nom: string; count: number }[];
  lastPost: { titre: string; contenu: string; createdAt: string } | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(DEFAULT_VISIBLE);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try { setVisible({ ...DEFAULT_VISIBLE, ...JSON.parse(saved) }); } catch { /* ignore */ }
    }
    fetch("/api/dashboard").then((r) => r.json()).then(setStats);
  }, []);

  const toggle = (id: string) => {
    setVisible((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const show = (id: string) => visible[id] !== false;

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-[#666666]">Chargement...</div>
      </div>
    );
  }

  const maxPresences = Math.max(...stats.graphPresences.map((m) => m.count), 1);
  const totalEleves = stats.kpis.totalEleves;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Tableau de bord</h1>
        <button onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-3 py-2 text-sm hover:bg-[#f9f9f9] transition-colors">
          <Settings size={15} />
          Personnaliser
        </button>
      </div>

      {/* KPIs */}
      {WIDGETS_CONFIG.filter((w) => w.group === "kpis" && show(w.id)).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {show("kpi_presences") && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#666666] text-sm">Présents aujourd&apos;hui</span>
                <CheckSquare size={18} className="text-[#cc0000]" />
              </div>
              <p className="text-3xl font-bold text-[#1a1a1a]">{stats.kpis.presencesAujourdhui}</p>
              <p className="text-xs text-[#666666] mt-1">sur {totalEleves} actifs</p>
            </div>
          )}
          {show("kpi_eleves") && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#666666] text-sm">Élèves actifs</span>
                <Users size={18} className="text-[#cc0000]" />
              </div>
              <p className="text-3xl font-bold text-[#1a1a1a]">{totalEleves}</p>
              <Link href="/admin/eleves" className="text-xs text-[#cc0000] hover:underline mt-1 block">Voir la liste</Link>
            </div>
          )}
          {show("kpi_taux") && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#666666] text-sm">Taux présence (mois)</span>
                <TrendingUp size={18} className="text-[#cc0000]" />
              </div>
              <p className="text-3xl font-bold text-[#1a1a1a]">{stats.kpis.tauxPresence}%</p>
              <p className="text-xs text-[#666666] mt-1">{stats.kpis.nbFideles} fidèles (≥3/mois)</p>
            </div>
          )}
          {show("kpi_impayes") && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#666666] text-sm">Impayés ce mois</span>
                <CreditCard size={18} className="text-[#cc0000]" />
              </div>
              <p className="text-3xl font-bold text-[#1a1a1a]">{stats.kpis.paiementsImpayesCeMois}</p>
              <Link href="/admin/paiements" className="text-xs text-[#cc0000] hover:underline mt-1 block">Voir paiements</Link>
            </div>
          )}
        </div>
      )}

      {/* Ligne 1 : graphique + répartition */}
      {(show("graph_presences") || show("distrib_ceintures")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {show("graph_presences") && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <h2 className="font-semibold text-[#1a1a1a] mb-4">Présences — 6 derniers mois</h2>
              <div className="flex items-end gap-2 h-32">
                {stats.graphPresences.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-[#666666]">{m.count}</span>
                    <div className="w-full bg-[#cc0000] rounded-t-[4px]"
                      style={{ height: `${Math.round((m.count / maxPresences) * 96)}px`, minHeight: m.count > 0 ? "4px" : "0" }} />
                    <span className="text-xs text-[#666666] capitalize">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {show("distrib_ceintures") && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <h2 className="font-semibold text-[#1a1a1a] mb-4">Répartition par ceinture</h2>
              <div className="space-y-3">
                {["BLANCHE", "BLEUE", "VIOLETTE", "MARRON", "NOIRE"].map((belt) => {
                  const count = stats.distribCeinture[belt] ?? 0;
                  const pct = totalEleves > 0 ? Math.round((count / totalEleves) * 100) : 0;
                  return (
                    <div key={belt} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CEINTURE_COLORS[belt].bg, border: CEINTURE_COLORS[belt].border ? `1px solid ${CEINTURE_COLORS[belt].border}` : undefined }} />
                      <span className="text-xs text-[#666666] w-16 capitalize">{belt.toLowerCase()}</span>
                      <div className="flex-1 bg-[#e5e5e5] rounded-full h-2">
                        <div className="bg-[#cc0000] h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-[#666666] w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ligne 2 : top5 + eligibles + dernière actu */}
      {(show("top5") || show("eligibles") || show("last_post")) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {show("top5") && stats.top5.length > 0 && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <h2 className="font-semibold text-[#1a1a1a] mb-4">Top présences ce mois</h2>
              <ol className="space-y-2">
                {stats.top5.map((e, i) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#cc0000] w-4">{i + 1}</span>
                    <span className="text-sm text-[#1a1a1a] flex-1">{e.prenom} {e.nom}</span>
                    <span className="text-xs font-semibold text-[#1a1a1a]">{e.count} cours</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {show("eligibles") && stats.eligibles.length > 0 && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                <Award size={16} className="text-[#cc0000]" />
                Éligibles à promotion ({stats.eligibles.length})
              </h2>
              <ul className="space-y-2">
                {stats.eligibles.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span className="text-sm text-[#1a1a1a]">{e.prenom} {e.nom}</span>
                    <span className="text-xs text-[#cc0000] font-medium">→ {e.nextBelt.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
              <Link href="/admin/ceintures" className="text-xs text-[#cc0000] hover:underline mt-3 block">Voir tous →</Link>
            </div>
          )}
          {show("last_post") && stats.lastPost && (
            <div className="bg-white rounded-[12px] shadow-sm p-5">
              <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                <Newspaper size={16} className="text-[#cc0000]" />
                Dernière actualité
              </h2>
              <p className="text-sm font-medium text-[#1a1a1a]">{stats.lastPost.titre}</p>
              <p className="text-xs text-[#666666] mt-1">
                {format(new Date(stats.lastPost.createdAt), "d MMMM yyyy", { locale: fr })}
              </p>
              <p className="text-sm text-[#666666] mt-2 line-clamp-2">{stats.lastPost.contenu}</p>
              <Link href="/admin/actualites" className="text-xs text-[#cc0000] hover:underline mt-3 block">Voir toutes →</Link>
            </div>
          )}
        </div>
      )}

      {/* Panneau de personnalisation */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="bg-white h-full w-80 shadow-xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-[#1a1a1a]">Personnaliser le dashboard</h2>
              <button onClick={() => setShowSettings(false)} className="text-[#666666] hover:text-[#1a1a1a]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-2">Indicateurs clés</p>
              {WIDGETS_CONFIG.filter((w) => w.group === "kpis").map((w) => (
                <button key={w.id} onClick={() => toggle(w.id)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-[8px] hover:bg-[#f9f9f9] transition-colors">
                  <span className="text-sm text-[#1a1a1a]">{w.label.replace("KPI — ", "")}</span>
                  {show(w.id)
                    ? <Eye size={16} className="text-[#cc0000]" />
                    : <EyeOff size={16} className="text-[#bbbbbb]" />}
                </button>
              ))}

              <p className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-2 mt-5">Widgets</p>
              {WIDGETS_CONFIG.filter((w) => w.group === "stats").map((w) => (
                <button key={w.id} onClick={() => toggle(w.id)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-[8px] hover:bg-[#f9f9f9] transition-colors">
                  <span className="text-sm text-[#1a1a1a]">{w.label}</span>
                  {show(w.id)
                    ? <Eye size={16} className="text-[#cc0000]" />
                    : <EyeOff size={16} className="text-[#bbbbbb]" />}
                </button>
              ))}
            </div>

            <button onClick={() => {
              setVisible(DEFAULT_VISIBLE);
              localStorage.removeItem(LS_KEY);
            }} className="mt-6 text-xs text-[#666666] hover:text-[#cc0000] transition-colors">
              Réinitialiser l&apos;affichage par défaut
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
