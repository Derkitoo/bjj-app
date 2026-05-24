"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus, X, Check, AlertCircle, Clock, ChevronRight,
  Users, RefreshCw, Pencil, Trash2, Tag, Search,
  Eye, EyeOff, Settings,
} from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";

interface Echeance {
  id: string;
  numero: number;
  montant: number;
  dateLimite: string;
  datePaiement: string | null;
  statut: string;
  modePaiement: string | null;
  note: string | null;
}

interface Cotisation {
  id: string;
  saison: string;
  montantBase: number;
  reductionRenouvellement: number;
  reductionFamille: number;
  reductionManuelle: number;
  montantTotal: number;
  nbEcheances: number;
  statut: string;
  notes: string | null;
  createdAt: string;
  eleve: { id: string; nom: string; prenom: string; ceinture: string; barrettes: number; actif: boolean; nomFamille: string | null };
  echeances: Echeance[];
}

interface EleveSimple {
  id: string;
  nom: string;
  prenom: string;
  ceinture: string;
  barrettes: number;
  nomFamille: string | null;
  actif: boolean;
}

function getSaisonActuelle(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function getSaisons(): string[] {
  const current = getSaisonActuelle();
  const [y1] = current.split("-").map(Number);
  return [`${y1 - 2}-${y1 - 1}`, `${y1 - 1}-${y1}`, current, `${y1 + 1}-${y1 + 2}`];
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Check }> = {
  COMPLETE:   { label: "Complet",     color: "text-green-700",  bg: "bg-green-100",  icon: Check },
  EN_COURS:   { label: "En cours",    color: "text-blue-700",   bg: "bg-blue-100",   icon: Clock },
  EN_RETARD:  { label: "En retard",   color: "text-red-700",    bg: "bg-red-100",    icon: AlertCircle },
  EN_ATTENTE: { label: "En attente",  color: "text-orange-700", bg: "bg-orange-100", icon: Clock },
  ANNULE:     { label: "Annulé",      color: "text-gray-500",   bg: "bg-gray-100",   icon: X },
};

const MODES_PAIEMENT = [
  { value: "especes",  label: "Espèces" },
  { value: "cheque",   label: "Chèque" },
  { value: "virement", label: "Virement" },
  { value: "cb",       label: "CB" },
];

/* ── Sections masquables ── */
const SECTIONS_CONFIG = [
  { id: "kpis",       label: "Indicateurs (KPIs)" },
  { id: "progression",label: "Barre de recouvrement" },
  { id: "filtres",    label: "Barre de recherche" },
  { id: "tableau",    label: "Tableau des cotisations" },
];
const DEFAULT_VISIBLE = Object.fromEntries(SECTIONS_CONFIG.map((s) => [s.id, true]));
const LS_KEY = "paiements_sections";

function EcheanceDots({ echeances }: { echeances: Echeance[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {echeances.map((e) => {
        const retard = e.statut !== "PAYE" && new Date(e.dateLimite) < new Date();
        return (
          <div
            key={e.id}
            title={`Échéance ${e.numero} — ${e.statut === "PAYE" ? "Payée" : retard ? "En retard" : "En attente"}`}
            className={`w-3 h-3 rounded-full border-2 transition-all ${
              e.statut === "PAYE"
                ? "bg-green-500 border-green-500"
                : retard
                ? "bg-red-100 border-red-500"
                : "bg-white border-[#d0d0d0]"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function PaiementsPage() {
  const [saison, setSaison] = useState(getSaisonActuelle());
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Cotisation | null>(null);
  const [modeEch, setModeEch] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"bulk" | "individuel">("bulk");
  const [allEleves, setAllEleves] = useState<EleveSimple[]>([]);
  const [eleveSearch, setEleveSearch] = useState("");
  const [selectedEleveId, setSelectedEleveId] = useState("");
  const [form, setForm] = useState({
    montantBase: "350",
    montantRenouvellement: "35",
    montantFamille: "70",
    reductionManuelle: "0",
    nbEcheances: "1",
    notes: "",
  });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ created: number; skipped: number } | null>(null);

  /* ── Visibilité sections ── */
  const [visible, setVisible] = useState<Record<string, boolean>>(DEFAULT_VISIBLE);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) { try { setVisible({ ...DEFAULT_VISIBLE, ...JSON.parse(saved) }); } catch { /* ignore */ } }
  }, []);

  const toggleSection = (id: string) => {
    setVisible((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };
  const show = (id: string) => visible[id] !== false;

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/cotisations?saison=${saison}`)
      .then((r) => r.json())
      .then((data) => { setCotisations(data); setLoading(false); });
  }, [saison]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showCreate && createMode === "individuel" && allEleves.length === 0) {
      fetch("/api/eleves?statut=actif").then((r) => r.json()).then(setAllEleves);
    }
  }, [showCreate, createMode, allEleves.length]);

  const marquerEcheance = async (cotId: string, echId: string, statut: string) => {
    const mode = modeEch[echId] || null;
    const res = await fetch(`/api/cotisations/${cotId}/echeances/${echId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut, modePaiement: mode }),
    });
    if (res.ok) {
      const { echeance, cotisationStatut } = await res.json();
      setCotisations((prev) =>
        prev.map((c) =>
          c.id === cotId
            ? {
                ...c,
                statut: cotisationStatut,
                echeances: c.echeances.map((e) => (e.id === echId ? { ...e, ...echeance } : e)),
              }
            : c
        )
      );
      if (selected?.id === cotId) {
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                statut: cotisationStatut,
                echeances: prev.echeances.map((e) => (e.id === echId ? { ...e, ...echeance } : e)),
              }
            : null
        );
      }
    }
  };

  const supprimerCotisation = async (id: string) => {
    await fetch(`/api/cotisations/${id}`, { method: "DELETE" });
    setCotisations((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const creerBulk = async () => {
    setCreating(true);
    setCreateResult(null);
    const res = await fetch("/api/cotisations/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saison,
        montantBase: parseFloat(form.montantBase),
        montantRenouvellement: parseFloat(form.montantRenouvellement),
        montantFamille: parseFloat(form.montantFamille),
        nbEcheances: parseInt(form.nbEcheances),
      }),
    });
    const data = await res.json();
    setCreateResult(data);
    setCreating(false);
    if (data.created > 0) load();
  };

  const creerIndividuel = async () => {
    if (!selectedEleveId) return;
    setCreating(true);
    const res = await fetch("/api/cotisations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eleveId: selectedEleveId,
        saison,
        montantBase: parseFloat(form.montantBase),
        reductionManuelle: parseFloat(form.reductionManuelle),
        nbEcheances: parseInt(form.nbEcheances),
        notes: form.notes || undefined,
      }),
    });
    if (res.ok) { load(); setShowCreate(false); }
    setCreating(false);
  };

  const filtered = cotisations.filter((c) => {
    if (filtreStatut && c.statut !== filtreStatut) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.eleve.nom.toLowerCase().includes(q) || c.eleve.prenom.toLowerCase().includes(q);
  });

  const totalAttendu = cotisations.reduce((s, c) => s + c.montantTotal, 0);
  const totalEncaisse = cotisations.reduce(
    (s, c) => s + c.echeances.filter((e) => e.statut === "PAYE").reduce((ss, e) => ss + e.montant, 0),
    0
  );
  const nbRetard = cotisations.filter((c) => c.statut === "EN_RETARD").length;
  const nbComplet = cotisations.filter((c) => c.statut === "COMPLETE").length;
  const pct = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;

  const saisons = getSaisons();
  const saisonActuelle = getSaisonActuelle();

  const inputClass = "border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] bg-white w-full";

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Cotisations</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 text-sm border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-[#666666] hover:bg-[#f9f9f9] transition-colors"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Personnaliser</span>
          </button>
          <button
            onClick={() => { setShowCreate(true); setCreateResult(null); }}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Créer cotisations</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>
      </div>

      {/* ── Saison tabs ── */}
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

      {/* ── KPIs ── */}
      {show("kpis") && cotisations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Inscrits</p>
            <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{cotisations.length}</p>
            <p className="text-xs text-[#999999] mt-0.5">{nbComplet} complet{nbComplet > 1 ? "s" : ""}</p>
          </div>
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Total attendu</p>
            <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{totalAttendu.toFixed(0)} €</p>
          </div>
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Encaissé</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totalEncaisse.toFixed(0)} €</p>
            <p className="text-xs text-[#999999] mt-0.5">{pct}% du total</p>
          </div>
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">En retard</p>
            <p className={`text-2xl font-bold mt-1 ${nbRetard > 0 ? "text-red-600" : "text-[#999999]"}`}>{nbRetard}</p>
            <p className="text-xs text-[#999999] mt-0.5">élève{nbRetard > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* ── Progression ── */}
      {show("progression") && cotisations.length > 0 && (
        <div className="bg-white rounded-[12px] shadow-sm p-3 mb-4">
          <div className="flex items-center justify-between text-xs text-[#666666] mb-1.5">
            <span>Taux de recouvrement</span>
            <span className="font-semibold text-[#1a1a1a]">{pct}%</span>
          </div>
          <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "#22c55e" : pct >= 50 ? "var(--color-primary)" : "#f97316" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#aaaaaa] mt-1">
            <span>0 €</span>
            <span>{totalEncaisse.toFixed(0)} € encaissés sur {totalAttendu.toFixed(0)} €</span>
          </div>
        </div>
      )}

      {/* ── Filtres ── */}
      {show("filtres") && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un élève..."
              className="w-full border border-[#e5e5e5] rounded-[8px] pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[#aaaaaa]"
            />
          </div>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Tableau ── */}
      {show("tableau") && (
        loading ? (
          <div className="bg-white rounded-[12px] shadow-sm p-12 text-center">
            <div className="w-8 h-8 border-4 border-[var(--color-primary-subtle)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[12px] shadow-sm p-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-[#e5e5e5]" />
            <p className="text-sm text-[#666666]">Aucune cotisation pour la saison {saison}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm text-[var(--color-primary)] hover:underline"
            >
              Créer les cotisations →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#f5f5f5] flex items-center justify-between">
              <p className="text-xs text-[#999999]">
                {filtered.length} cotisation{filtered.length > 1 ? "s" : ""}
                {search || filtreStatut ? ` (filtrée${filtered.length > 1 ? "s" : ""})` : ""}
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e5e5]">
                  <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Élève</th>
                  <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden sm:table-cell">Montant</th>
                  <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden md:table-cell">Mode</th>
                  <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Échéances</th>
                  <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Statut</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const sc = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG.EN_ATTENTE;
                  const Icon = sc.icon;
                  const hasReduc = c.reductionRenouvellement > 0 || c.reductionFamille > 0 || c.reductionManuelle > 0;
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-[#f5f5f5] hover:bg-[var(--color-primary-bg)] transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-medium text-[#1a1a1a]">{c.eleve.prenom} {c.eleve.nom}</p>
                            {c.eleve.nomFamille && (
                              <p className="text-xs text-[#999999] flex items-center gap-1">
                                <Tag size={9} />
                                {c.eleve.nomFamille}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="text-sm font-semibold text-[#1a1a1a]">{c.montantTotal.toFixed(0)} €</div>
                        {hasReduc && (
                          <div className="text-[10px] text-green-600 mt-0.5">
                            -{(c.reductionRenouvellement + c.reductionFamille + c.reductionManuelle).toFixed(0)} €
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs font-medium text-[#666666] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
                          {c.nbEcheances}×
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <EcheanceDots echeances={c.echeances} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                          <Icon size={11} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight size={15} className="text-[#cccccc] ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Modal détail cotisation ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-t-[20px] sm:rounded-[16px] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-[#f0f0f0] sticky top-0 bg-white z-10">
              <div>
                <p className="font-bold text-[#1a1a1a]">{selected.eleve.prenom} {selected.eleve.nom}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CeintureBadge ceinture={selected.eleve.ceinture} barrettes={selected.eleve.barrettes} size="sm" />
                  <span className="text-xs text-[#999999]">Saison {selected.saison}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => supprimerCotisation(selected.id)}
                  className="text-[#cccccc] hover:text-red-500 p-1 transition-colors"
                  title="Supprimer la cotisation"
                >
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setSelected(null)} className="text-[#999999] hover:text-[#1a1a1a] p-1 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-5 pt-4 pb-3">
              <div className="bg-[#f9f9f9] rounded-[12px] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Tarif de base</span>
                  <span className="font-medium text-[#1a1a1a]">{selected.montantBase.toFixed(2)} €</span>
                </div>
                {selected.reductionRenouvellement > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1.5">
                      <RefreshCw size={12} />
                      Réduction renouvellement
                    </span>
                    <span className="font-medium text-green-600">−{selected.reductionRenouvellement.toFixed(2)} €</span>
                  </div>
                )}
                {selected.reductionFamille > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1.5">
                      <Users size={12} />
                      Réduction famille
                    </span>
                    <span className="font-medium text-green-600">−{selected.reductionFamille.toFixed(2)} €</span>
                  </div>
                )}
                {selected.reductionManuelle > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1.5">
                      <Tag size={12} />
                      Réduction manuelle
                    </span>
                    <span className="font-medium text-green-600">−{selected.reductionManuelle.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-[#e5e5e5] pt-2">
                  <span className="text-[#1a1a1a]">Total</span>
                  <span className="text-[#1a1a1a]">{selected.montantTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-2">
              <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">
                Échéances ({selected.nbEcheances}×{(selected.montantTotal / selected.nbEcheances).toFixed(2)} €)
              </p>
              <div className="space-y-3">
                {selected.echeances.map((e) => {
                  const retard = e.statut !== "PAYE" && new Date(e.dateLimite) < new Date();
                  return (
                    <div key={e.id} className={`rounded-[12px] border-2 p-4 transition-all ${
                      e.statut === "PAYE"
                        ? "border-green-200 bg-green-50"
                        : retard
                        ? "border-red-200 bg-red-50"
                        : "border-[#f0f0f0] bg-[#fafafa]"
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#666666]">
                              {e.numero === 1 ? "1ère" : `${e.numero}ème`} échéance
                            </span>
                            <span className="text-sm font-bold text-[#1a1a1a]">{e.montant.toFixed(2)} €</span>
                          </div>
                          <p className="text-xs text-[#999999] mt-0.5">
                            Échéance le {format(new Date(e.dateLimite), "d MMMM yyyy", { locale: fr })}
                          </p>
                          {e.datePaiement && (
                            <p className="text-xs text-green-600 mt-0.5">
                              Payée le {format(new Date(e.datePaiement), "d MMM yyyy", { locale: fr })}
                              {e.modePaiement && ` · ${MODES_PAIEMENT.find((m) => m.value === e.modePaiement)?.label ?? e.modePaiement}`}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {e.statut === "PAYE" ? (
                            <button
                              onClick={() => marquerEcheance(selected.id, e.id, "EN_ATTENTE")}
                              className="text-xs text-[#999999] hover:text-red-500 transition-colors px-2 py-1 rounded"
                            >
                              Annuler
                            </button>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <select
                                value={modeEch[e.id] ?? ""}
                                onChange={(ev) => setModeEch((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                                className="border border-[#e5e5e5] rounded-[6px] px-2 py-1 text-xs bg-white focus:outline-none focus:border-[var(--color-primary)]"
                              >
                                <option value="">Mode de paiement</option>
                                {MODES_PAIEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                              </select>
                              <button
                                onClick={() => marquerEcheance(selected.id, e.id, "PAYE")}
                                className="text-xs bg-green-500 text-white rounded-[6px] px-3 py-1.5 hover:bg-green-600 transition-colors font-medium"
                              >
                                ✓ Marquer payée
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selected.notes && (
              <div className="px-5 pb-4 mt-2">
                <p className="text-xs text-[#999999] mb-1">Notes</p>
                <p className="text-sm text-[#666666]">{selected.notes}</p>
              </div>
            )}
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ── Modal création ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowCreate(false)}>
          <div
            className="bg-white rounded-t-[20px] sm:rounded-[16px] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#f0f0f0] sticky top-0 bg-white z-10">
              <h2 className="font-bold text-[#1a1a1a]">Créer des cotisations</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#999999] hover:text-[#1a1a1a] p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                {(["bulk", "individuel"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setCreateMode(m)}
                    className={`py-2.5 rounded-[8px] text-sm font-medium transition-colors border-2 ${
                      createMode === m
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                        : "border-transparent bg-[#f5f5f5] text-[#666666] hover:bg-[#eeeeee]"
                    }`}
                  >
                    {m === "bulk" ? "👥 Pour tous les actifs" : "👤 Individuel"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1.5">Saison</label>
                <select value={saison} onChange={(e) => setSaison(e.target.value)} className={inputClass}>
                  {saisons.map((s) => <option key={s} value={s}>{s}{s === saisonActuelle ? " (en cours)" : ""}</option>)}
                </select>
              </div>

              {createMode === "individuel" && (
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1.5">Élève</label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" />
                    <input
                      value={eleveSearch}
                      onChange={(e) => setEleveSearch(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full border border-[#e5e5e5] rounded-[8px] pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[#aaaaaa]"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto border border-[#e5e5e5] rounded-[8px]">
                    {allEleves
                      .filter((e) => {
                        const q = eleveSearch.toLowerCase();
                        return !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q);
                      })
                      .slice(0, 15)
                      .map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEleveId(e.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                            selectedEleveId === e.id
                              ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                              : "hover:bg-[#f9f9f9] text-[#1a1a1a]"
                          }`}
                        >
                          {e.prenom} {e.nom}
                          {e.nomFamille && <span className="text-xs text-[#aaaaaa] ml-auto">{e.nomFamille}</span>}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1.5">Tarif de base (€)</label>
                  <input type="number" value={form.montantBase} onChange={(e) => setForm((f) => ({ ...f, montantBase: e.target.value }))} min="0" step="5" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1.5">Versements</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: "1", label: "1×" }, { v: "3", label: "3×" }].map(({ v, label }) => (
                      <button
                        key={v}
                        onClick={() => setForm((f) => ({ ...f, nbEcheances: v }))}
                        className={`py-2 rounded-[8px] text-sm font-medium border-2 transition-colors ${
                          form.nbEcheances === v
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                            : "border-[#e5e5e5] text-[#666666] hover:border-[#cccccc]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {form.nbEcheances === "3" && (
                    <p className="text-xs text-[#999999] mt-1.5">Sept · Jan · Avr</p>
                  )}
                </div>
              </div>

              {createMode === "bulk" && (
                <div className="bg-green-50 rounded-[12px] p-4 space-y-3">
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                    <Tag size={13} />
                    Réductions automatiques
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-green-700 mb-1">Renouvellement (€)</label>
                      <input type="number" value={form.montantRenouvellement} onChange={(e) => setForm((f) => ({ ...f, montantRenouvellement: e.target.value }))} min="0" step="5"
                        className="w-full border border-green-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white" />
                      <p className="text-[10px] text-green-600 mt-0.5">Élèves déjà inscrits l&apos;an dernier</p>
                    </div>
                    <div>
                      <label className="block text-xs text-green-700 mb-1">Famille (€)</label>
                      <input type="number" value={form.montantFamille} onChange={(e) => setForm((f) => ({ ...f, montantFamille: e.target.value }))} min="0" step="5"
                        className="w-full border border-green-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white" />
                      <p className="text-[10px] text-green-600 mt-0.5">2ème membre même famille</p>
                    </div>
                  </div>
                </div>
              )}

              {createMode === "individuel" && (
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1.5">Réduction manuelle (€)</label>
                  <input type="number" value={form.reductionManuelle} onChange={(e) => setForm((f) => ({ ...f, reductionManuelle: e.target.value }))} min="0" step="5" className={inputClass} />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1.5">Notes (facultatif)</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                  placeholder="Informations complémentaires..."
                  className={inputClass + " resize-none placeholder:text-[#aaaaaa]"} />
              </div>

              <div className="bg-[#f5f5f5] rounded-[10px] p-3 text-sm text-[#666666]">
                <p className="font-medium text-[#1a1a1a] mb-1">Aperçu</p>
                <p>
                  Tarif : <b>{form.montantBase} €</b>
                  {createMode === "bulk" && parseInt(form.montantRenouvellement) > 0 && <> · Renouvellement : <b className="text-green-600">−{form.montantRenouvellement} €</b></>}
                  {createMode === "bulk" && parseInt(form.montantFamille) > 0 && <> · Famille : <b className="text-green-600">−{form.montantFamille} €</b></>}
                  {createMode === "individuel" && parseInt(form.reductionManuelle) > 0 && <> · Remise : <b className="text-green-600">−{form.reductionManuelle} €</b></>}
                </p>
                <p className="mt-0.5">
                  {form.nbEcheances === "3" ? "Paiement en 3× (Sept · Jan · Avr)" : "Paiement intégral (1×)"}
                </p>
                {createMode === "individuel" && selectedEleveId && (
                  <p className="mt-0.5 text-[var(--color-primary)] font-medium">
                    {allEleves.find((e) => e.id === selectedEleveId)?.prenom} {allEleves.find((e) => e.id === selectedEleveId)?.nom}
                  </p>
                )}
              </div>

              {createResult && (
                <div className="bg-green-50 border border-green-200 rounded-[10px] p-3 text-sm">
                  <p className="font-semibold text-green-700">{createResult.created} cotisation{createResult.created > 1 ? "s" : ""} créée{createResult.created > 1 ? "s" : ""}</p>
                  {createResult.skipped > 0 && <p className="text-green-600">{createResult.skipped} déjà existant{createResult.skipped > 1 ? "es" : "e"} (ignoré{createResult.skipped > 1 ? "es" : "e"})</p>}
                </div>
              )}

              <button
                onClick={createMode === "bulk" ? creerBulk : creerIndividuel}
                disabled={creating || (createMode === "individuel" && !selectedEleveId)}
                className="w-full bg-[var(--color-primary)] text-white rounded-[8px] py-3 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
              >
                {creating
                  ? "Création en cours..."
                  : createMode === "bulk"
                  ? `Créer pour tous les élèves actifs — ${saison}`
                  : "Créer la cotisation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panneau Personnaliser ── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div
            className="h-full w-72 bg-white shadow-2xl p-6 overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-[#1a1a1a]">Personnaliser</h2>
              <button onClick={() => setShowSettings(false)} className="text-[#999999] hover:text-[#1a1a1a] transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-[#999999] mb-3">
              Sections affichées
            </p>

            <div className="space-y-1 flex-1">
              {SECTIONS_CONFIG.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSection(s.id)}
                  className="flex items-center justify-between w-full px-3 py-3 rounded-[8px] hover:bg-[#f5f5f5] transition-colors"
                >
                  <span className="text-sm text-[#1a1a1a]">{s.label}</span>
                  {show(s.id)
                    ? <Eye size={16} className="text-[var(--color-primary)]" />
                    : <EyeOff size={16} className="text-[#cccccc]" />
                  }
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#f0f0f0]">
              <button
                onClick={() => {
                  const reset = Object.fromEntries(SECTIONS_CONFIG.map((s) => [s.id, true]));
                  setVisible(reset);
                  localStorage.setItem(LS_KEY, JSON.stringify(reset));
                }}
                className="text-xs text-[#999999] hover:text-[#1a1a1a] transition-colors"
              >
                Tout réafficher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
