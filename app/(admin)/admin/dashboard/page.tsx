"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users, CheckSquare, Award, Newspaper, TrendingUp, CreditCard,
  Settings, X, Eye, EyeOff, Medal, UserPlus, QrCode, ClipboardList, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCountUp } from "@/hooks/useCountUp";

/* ── Belt colors ── */
const BELT_COLORS: Record<string, string> = {
  BLANCHE: "#d1d5db", BLEUE: "#3b82f6", VIOLETTE: "#8b5cf6", MARRON: "#92400e", NOIRE: "#1a1a1a",
};
const BELT_LABELS: Record<string, string> = {
  BLANCHE: "Blanche", BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire",
};

/* ── Widgets config ── */
const WIDGETS_CONFIG = [
  { id: "kpi_presences",     label: "Présents aujourd'hui",         group: "kpis" },
  { id: "kpi_eleves",        label: "Élèves actifs",                group: "kpis" },
  { id: "kpi_taux",          label: "Taux de présence",             group: "kpis" },
  { id: "kpi_impayes",       label: "Impayés ce mois",              group: "kpis" },
  { id: "graph_presences",   label: "Graphique présences (6 mois)", group: "stats" },
  { id: "distrib_ceintures", label: "Répartition par ceinture",     group: "stats" },
  { id: "top5",              label: "Top 5 présences ce mois",      group: "stats" },
  { id: "eligibles",         label: "Éligibles à promotion",        group: "stats" },
  { id: "last_post",         label: "Dernière actualité",           group: "stats" },
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

/* ── SVG Area Chart ── */
function PresenceChart({ data }: { data: { label: string; count: number }[] }) {
  const W = 500; const H = 110; const PX = 8; const PY = 12;
  const plotW = W - 2 * PX; const plotH = H - 2 * PY;
  const max = Math.max(...data.map((d) => d.count), 1);
  const pts = data.map((d, i) => ({
    x: PX + (i / Math.max(data.length - 1, 1)) * plotW,
    y: PY + plotH - (d.count / max) * plotH,
    ...d,
  }));
  const line = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = pts[i - 1];
    const mx = (prev.x + p.x) / 2;
    return `${acc} C ${mx},${prev.y} ${mx},${p.y} ${p.x},${p.y}`;
  }, "");
  const area = pts.length > 1
    ? `${line} L ${pts[pts.length - 1].x},${H} L ${pts[0].x},${H} Z`
    : "";
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {pts.slice(0, -1).map((p, i) => (
          <line key={i} x1={p.x} y1={PY + plotH} x2={p.x} y2={p.y}
            stroke="var(--color-primary)" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="2 3" />
        ))}
        <path d={area} fill="url(#areaGrad)" />
        <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" />
            <circle cx={p.x} cy={p.y} r="7" fill="var(--color-primary)" fillOpacity="0.15" />
            <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="9" fill="var(--c-text-2, #666666)">{p.count}</text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-2">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] capitalize" style={{ color: "var(--c-text-2)" }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ── SVG Donut Chart ── */
function DonutChart({ data, total }: { data: Record<string, number>; total: number }) {
  const cx = 55; const cy = 55; const R = 42; const r = 28;
  const BELTS = ["BLANCHE", "BLEUE", "VIOLETTE", "MARRON", "NOIRE"];

  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const polar = (radius: number, deg: number) => ({
    x: cx + radius * Math.cos(toRad(deg)),
    y: cy + radius * Math.sin(toRad(deg)),
  });
  const arcPath = (s: number, e: number) => {
    if (Math.abs(e - s) >= 360) e = s + 359.99;
    const o1 = polar(R, s); const o2 = polar(R, e);
    const i1 = polar(r, e); const i2 = polar(r, s);
    const lg = e - s > 180 ? 1 : 0;
    return `M ${o1.x} ${o1.y} A ${R} ${R} 0 ${lg} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${r} ${r} 0 ${lg} 0 ${i2.x} ${i2.y} Z`;
  };

  let deg = 0;
  const segs = BELTS.map((belt) => {
    const count = data[belt] ?? 0;
    const frac = total > 0 ? count / total : 0;
    const start = deg;
    deg += frac * 360;
    return { belt, count, frac, start, end: deg };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="110" height="110" viewBox="0 0 110 110" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none"
          stroke="var(--c-border, #e5e5e5)" strokeWidth={R - r} />
        {segs.filter((s) => s.frac > 0.001).map((s) => (
          <path key={s.belt} d={arcPath(s.start, s.end)} fill={BELT_COLORS[s.belt]} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="var(--c-text-2, #666)">Total</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="18" fontWeight="bold" fill="var(--c-text-1, #1a1a1a)">{total}</text>
      </svg>
      <div className="flex-1 space-y-2.5">
        {BELTS.map((belt) => {
          const count = data[belt] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={belt} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: BELT_COLORS[belt], outline: belt === "BLANCHE" ? "1px solid #ccc" : "none" }} />
              <span className="text-xs w-14" style={{ color: "var(--c-text-2)" }}>{BELT_LABELS[belt]}</span>
              <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: "var(--c-border)" }}>
                <div className="h-1.5 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: BELT_COLORS[belt] }} />
              </div>
              <span className="text-xs font-semibold w-4 text-right" style={{ color: "var(--c-text-1)" }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, link, linkLabel, delay = 0 }: {
  label: string; value: number; sub?: string; icon: React.ElementType;
  link?: string; linkLabel?: string; delay?: number;
}) {
  const count = useCountUp(value);
  return (
    <div className="rounded-[16px] p-5 animate-fade-up relative overflow-hidden"
      style={{ animationDelay: `${delay}ms`, backgroundColor: "var(--c-card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-[0.06]"
        style={{ backgroundColor: "var(--color-primary)" }} />
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--c-text-3)" }}>{label}</span>
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ backgroundColor: "var(--color-primary-subtle)" }}>
          <Icon size={17} style={{ color: "var(--color-primary)" }} />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--c-text-1)" }}>{count}</p>
      {sub && <p className="text-xs mt-1.5" style={{ color: "var(--c-text-3)" }}>{sub}</p>}
      {link && linkLabel && (
        <Link href={link} className="text-xs mt-3 block hover:underline font-medium"
          style={{ color: "var(--color-primary)" }}>{linkLabel} →</Link>
      )}
    </div>
  );
}

/* ── Quick Action ── */
function QuickAction({ href, icon: Icon, label, desc }: { href: string; icon: React.ElementType; label: string; desc: string }) {
  return (
    <Link href={href}
      className="flex items-center gap-3 rounded-[12px] px-4 py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ backgroundColor: "var(--c-card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--color-primary-subtle)" }}>
        <Icon size={19} style={{ color: "var(--color-primary)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text-1)" }}>{label}</p>
        <p className="text-xs truncate" style={{ color: "var(--c-text-3)" }}>{desc}</p>
      </div>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

/* ── Main ── */
export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(DEFAULT_VISIBLE);
  const [showSettings, setShowSettings] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) { try { setVisible({ ...DEFAULT_VISIBLE, ...JSON.parse(saved) }); } catch { /* ignore */ } }
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--color-primary-subtle)", borderTopColor: "var(--color-primary)" }} />
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Chargement...</p>
        </div>
      </div>
    );
  }

  const totalEleves = stats.kpis.totalEleves;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--c-text-1)" }}>
            {getGreeting()}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--c-text-3)" }}>
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <button onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 text-sm rounded-[8px] px-3 py-2 transition-colors flex-shrink-0"
          style={{ border: "1px solid var(--c-border)", color: "var(--c-text-2)", backgroundColor: "var(--c-card)" }}>
          <Settings size={15} />
          <span className="hidden sm:inline">Personnaliser</span>
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction href="/admin/eleves/nouveau" icon={UserPlus} label="Nouvel élève" desc="Ajouter un membre" />
        <QuickAction href="/admin/presence" icon={QrCode} label="Appel / QR" desc="Marquer les présences" />
        <QuickAction href="/admin/examens/nouveau" icon={ClipboardList} label="Nouvel examen" desc="Créer une session" />
        <QuickAction href="/admin/planning" icon={Calendar} label="Planning" desc="Voir le programme" />
      </div>

      {/* KPIs */}
      {WIDGETS_CONFIG.filter((w) => w.group === "kpis" && show(w.id)).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {show("kpi_presences") && (
            <KpiCard label="Présents aujourd'hui" value={stats.kpis.presencesAujourdhui}
              sub={`sur ${totalEleves} actifs`} icon={CheckSquare} delay={0} />
          )}
          {show("kpi_eleves") && (
            <KpiCard label="Élèves actifs" value={totalEleves}
              icon={Users} link="/admin/eleves" linkLabel="Voir la liste" delay={80} />
          )}
          {show("kpi_taux") && (
            <KpiCard label="Taux de présence" value={stats.kpis.tauxPresence}
              sub={`${stats.kpis.nbFideles} fidèles (≥3/mois)`} icon={TrendingUp} delay={160} />
          )}
          {show("kpi_impayes") && (
            <KpiCard label="Impayés ce mois" value={stats.kpis.paiementsImpayesCeMois}
              icon={CreditCard} link="/admin/paiements" linkLabel="Voir paiements" delay={240} />
          )}
        </div>
      )}

      {/* Charts row */}
      {(show("graph_presences") || show("distrib_ceintures")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {show("graph_presences") && (
            <div className="rounded-[16px] p-5 animate-fade-up"
              style={{ animationDelay: "100ms", backgroundColor: "var(--c-card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm" style={{ color: "var(--c-text-1)" }}>Présences — 6 mois</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                  {stats.kpis.presencesMois} ce mois
                </span>
              </div>
              <PresenceChart data={stats.graphPresences} />
            </div>
          )}
          {show("distrib_ceintures") && (
            <div className="rounded-[16px] p-5 animate-fade-up"
              style={{ animationDelay: "180ms", backgroundColor: "var(--c-card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--c-text-1)" }}>Répartition par ceinture</h2>
              <DonutChart data={stats.distribCeinture} total={totalEleves} />
            </div>
          )}
        </div>
      )}

      {/* Bottom row */}
      {(show("top5") || show("eligibles") || show("last_post")) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {show("top5") && stats.top5.length > 0 && (
            <div className="rounded-[16px] p-5 animate-fade-up"
              style={{ animationDelay: "200ms", backgroundColor: "var(--c-card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--c-text-1)" }}>
                <Medal size={16} style={{ color: "var(--color-primary)" }} />
                Top présences ce mois
              </h2>
              <ol className="space-y-3">
                {stats.top5.map((e, i) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--c-border)",
                        color: i < 3 ? "white" : "var(--c-text-2)",
                      }}>
                      {i + 1}
                    </span>
                    <span className="text-sm flex-1 truncate" style={{ color: "var(--c-text-1)" }}>{e.prenom} {e.nom}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                      {e.count}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {show("eligibles") && stats.eligibles.length > 0 && (
            <div className="rounded-[16px] p-5 animate-fade-up"
              style={{ animationDelay: "280ms", backgroundColor: "var(--c-card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--c-text-1)" }}>
                <Award size={16} style={{ color: "var(--color-primary)" }} />
                Éligibles à promotion ({stats.eligibles.length})
              </h2>
              <ul className="space-y-2.5">
                {stats.eligibles.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: BELT_COLORS[e.ceinture] ?? "#999" }} />
                      <span className="text-sm truncate" style={{ color: "var(--c-text-1)" }}>{e.prenom} {e.nom}</span>
                    </div>
                    <span className="text-xs font-medium flex-shrink-0"
                      style={{ color: BELT_COLORS[e.nextBelt] ?? "var(--color-primary)" }}>
                      → {BELT_LABELS[e.nextBelt]}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/admin/ceintures" className="text-xs mt-3 block hover:underline font-medium"
                style={{ color: "var(--color-primary)" }}>Voir tous →</Link>
            </div>
          )}
          {show("last_post") && stats.lastPost && (
            <div className="rounded-[16px] p-5 animate-fade-up"
              style={{ animationDelay: "360ms", backgroundColor: "var(--c-card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--c-text-1)" }}>
                <Newspaper size={16} style={{ color: "var(--color-primary)" }} />
                Dernière actualité
              </h2>
              <p className="text-sm font-semibold" style={{ color: "var(--c-text-1)" }}>{stats.lastPost.titre}</p>
              <p className="text-xs mt-1" style={{ color: "var(--c-text-3)" }}>
                {format(new Date(stats.lastPost.createdAt), "d MMMM yyyy", { locale: fr })}
              </p>
              <p className="text-sm mt-2 line-clamp-3" style={{ color: "var(--c-text-2)" }}>
                {stats.lastPost.contenu}
              </p>
              <Link href="/admin/actualites" className="text-xs mt-3 block hover:underline font-medium"
                style={{ color: "var(--color-primary)" }}>Voir toutes →</Link>
            </div>
          )}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="h-full w-80 shadow-2xl p-6 overflow-y-auto"
            style={{ backgroundColor: "var(--c-card)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold" style={{ color: "var(--c-text-1)" }}>Personnaliser</h2>
              <button onClick={() => setShowSettings(false)}>
                <X size={18} style={{ color: "var(--c-text-2)" }} />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--c-text-3)" }}>Indicateurs clés</p>
              {WIDGETS_CONFIG.filter((w) => w.group === "kpis").map((w) => (
                <button key={w.id} onClick={() => toggle(w.id)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-[8px] transition-colors"
                  style={{ color: "var(--c-text-1)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--c-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <span className="text-sm">{w.label}</span>
                  {show(w.id)
                    ? <Eye size={16} style={{ color: "var(--color-primary)" }} />
                    : <EyeOff size={16} style={{ color: "var(--c-text-3)" }} />}
                </button>
              ))}
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 mt-5" style={{ color: "var(--c-text-3)" }}>Widgets</p>
              {WIDGETS_CONFIG.filter((w) => w.group === "stats").map((w) => (
                <button key={w.id} onClick={() => toggle(w.id)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-[8px] transition-colors"
                  style={{ color: "var(--c-text-1)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--c-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <span className="text-sm">{w.label}</span>
                  {show(w.id)
                    ? <Eye size={16} style={{ color: "var(--color-primary)" }} />
                    : <EyeOff size={16} style={{ color: "var(--c-text-3)" }} />}
                </button>
              ))}
            </div>
            <button onClick={() => { setVisible(DEFAULT_VISIBLE); localStorage.removeItem(LS_KEY); }}
              className="mt-6 text-xs transition-colors hover:underline"
              style={{ color: "var(--c-text-2)" }}>
              Réinitialiser l&apos;affichage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
