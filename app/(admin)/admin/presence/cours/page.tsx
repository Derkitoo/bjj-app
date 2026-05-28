"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Users, X, Plus, Trash2, Search, ChevronRight,
  ArrowLeft, QrCode, Clock, SortAsc, Copy, Check, RefreshCw, Minimize2, Maximize2,
} from "lucide-react";
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
  categorie: string;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  ceinture: string;
  barrettes: number;
  categorie: string;
}

interface Presence {
  id: string;
  eleveId: string;
  eleve: Eleve;
}

const JOURS: Record<number, string> = { 0: "Dimanche", 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi" };
const TYPES: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Enfants", COMPETITION: "Compétition", OPEN_MAT: "Open Mat" };
const TYPE_DOTS: Record<string, string> = { GI: "#3b82f6", NO_GI: "#8b5cf6", KIDS: "#22c55e", COMPETITION: "#ef4444", OPEN_MAT: "#94a3b8" };

const BELT_ORDER: Record<string, number> = { NOIRE: 0, MARRON: 1, VIOLETTE: 2, BLEUE: 3, BLANCHE: 4 };

const formatHeure = (time: string): string => {
  const [h, m] = time.split(":").map(Number);
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

const formatPlage = (heureDebut: string, duree: number): string => {
  const [h, m] = heureDebut.split(":").map(Number);
  const totalMin = h * 60 + m + duree;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  const fin = endM > 0 ? `${endH}h${String(endM).padStart(2, "0")}` : `${endH}h`;
  return `${formatHeure(heureDebut)} → ${fin}`;
};

function countdownStr(expires: number): string {
  const diff = Math.max(0, expires - Date.now());
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type SortMode = "alpha" | "ceinture";

export default function PresenceCoursPage() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [selected, setSelected] = useState<Cours | null>(null);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [allEleves, setAllEleves] = useState<Eleve[]>([]);
  const [searchAdd, setSearchAdd] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [presenceCounts, setPresenceCounts] = useState<Record<string, number>>({});
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [qrData, setQrData] = useState<{ dataUrl: string; expires: number; url: string } | null>(null);
  const [countdown, setCountdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setCountsLoaded(true);
      });
    });
    fetch("/api/eleves?statut=actif").then((r) => r.json()).then(setAllEleves);
  }, []);

  useEffect(() => {
    if (!qrData) { if (timerRef.current) clearInterval(timerRef.current); return; }
    setCountdown(countdownStr(qrData.expires));
    timerRef.current = setInterval(() => {
      setCountdown(countdownStr(qrData.expires));
      if (Date.now() >= qrData.expires) clearInterval(timerRef.current!);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qrData]);

  const openCours = async (c: Cours) => {
    setSelected(c);
    setShowAdd(false);
    setSearchAdd("");
    setQrData(null);
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

  const genererQR = async () => {
    if (!selected) return;
    const res = await fetch("/api/presences/qrcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coursId: selected.id }),
    });
    const data = await res.json();
    const url = `${window.location.origin}/eleve/accueil?token=${data.token}`;
    setQrData({ dataUrl: data.qrDataUrl, expires: data.expires, url });
  };

  const copierLien = async () => {
    if (!qrData) return;
    await navigator.clipboard.writeText(qrData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const absentIds = new Set(presences.map((p) => p.eleveId));
  const eligibles = allEleves.filter((e) => {
    if (absentIds.has(e.id)) return false;
    if (selected && selected.categorie !== "TOUS" && e.categorie !== selected.categorie) return false;
    const q = searchAdd.toLowerCase();
    return !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q);
  });

  const presencesSorted = [...presences].sort((a, b) => {
    if (sortMode === "ceinture") {
      const diff = (BELT_ORDER[a.eleve.ceinture] ?? 9) - (BELT_ORDER[b.eleve.ceinture] ?? 9);
      if (diff !== 0) return diff;
    }
    return a.eleve.nom.localeCompare(b.eleve.nom);
  });

  const groupedCours = [1, 2, 3, 4, 5, 6, 0].reduce<Record<number, Cours[]>>((acc, j) => {
    const cs = cours.filter((c) => c.jour === j).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    if (cs.length) acc[j] = cs;
    return acc;
  }, {});

  const isExpired = qrData ? Date.now() >= qrData.expires : false;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/presence" className="text-[#666666] hover:text-[#1a1a1a] p-1 -ml-1 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Présence par cours</h1>
          {countsLoaded && (
            <p className="text-xs text-[#999999] mt-0.5">
              {Object.values(presenceCounts).reduce((a, b) => a + b, 0)} présences enregistrées
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* ── Liste des cours ── */}
        <div className="lg:w-72 flex-shrink-0 space-y-3">
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
                    const count = presenceCounts[c.id];
                    return (
                      <button
                        key={c.id}
                        onClick={() => openCours(c)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-primary-bg)] ${isActive ? "bg-[var(--color-primary-bg)]" : ""}`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_DOTS[c.type] ?? "#aaa" }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-[#1a1a1a] truncate">{TYPES[c.type]}</p>
                            {c.categorie === "KIDS" && <span className="text-[9px] px-1 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">Enfants</span>}
                            {c.categorie === "ADULTES" && <span className="text-[9px] px-1 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0">Adultes</span>}
                          </div>
                          <p className="text-xs text-[#999999] flex items-center gap-1 mt-0.5">
                            <Clock size={10} />
                            {formatPlage(c.heureDebut, c.duree)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {countsLoaded ? (
                            <span className={`text-xs font-bold tabular-nums ${count > 0 ? "text-[var(--color-primary)]" : "text-[#cccccc]"}`}>
                              {count ?? 0}
                            </span>
                          ) : (
                            <span className="w-4 h-3 bg-[#f0f0f0] rounded animate-pulse" />
                          )}
                          <Users size={12} className="text-[#cccccc]" />
                          <ChevronRight size={14} className={isActive ? "text-[var(--color-primary)]" : "text-[#cccccc]"} />
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
          <div className="flex-1 bg-white rounded-[12px] shadow-sm overflow-hidden min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#1a1a1a]">
                    {JOURS[selected.jour]} · {TYPES[selected.type]}
                    {selected.titre && <span className="font-normal text-[#666666]"> · {selected.titre}</span>}
                  </p>
                  {selected.categorie === "ADULTES" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">🥋 Adultes</span>
                  )}
                  {selected.categorie === "KIDS" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">⭐ Enfants</span>
                  )}
                </div>
                <p className="text-xs text-[#999999] mt-0.5 flex items-center gap-1">
                  <Clock size={10} />
                  {formatPlage(selected.heureDebut, selected.duree)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  {presences.length} présent{presences.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={genererQR}
                  className="flex items-center gap-1.5 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-3 py-1.5 text-xs font-medium hover:bg-[#f9f9f9] transition-colors"
                >
                  <QrCode size={13} />
                  QR Code
                </button>
                <button
                  onClick={() => setShowAdd((v) => !v)}
                  className="flex items-center gap-1.5 bg-[var(--color-primary)] text-white rounded-[8px] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  <Plus size={13} />
                  Ajouter
                </button>
                <button onClick={() => { setSelected(null); setQrData(null); }} className="text-[#aaaaaa] hover:text-[#666666] p-1 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* QR mini inline */}
            {qrData && (
              <div className="mx-5 mt-4 mb-0 bg-[#f9f9f9] rounded-[12px] p-4 flex items-center gap-4 border border-[#f0f0f0]">
                <img
                  src={qrData.dataUrl}
                  alt="QR"
                  className={`w-20 h-20 rounded-[8px] flex-shrink-0 ${isExpired ? "opacity-30 grayscale" : ""}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold text-[#1a1a1a]">QR Code actif</p>
                    {!isExpired && (
                      <span className={`text-xs font-bold tabular-nums ${countdown.startsWith("0:") ? "text-red-500" : "text-[var(--color-primary)]"}`}>
                        {countdown}
                      </span>
                    )}
                    {isExpired && <span className="text-xs text-red-500 font-semibold">Expiré</span>}
                  </div>
                  {!isExpired && (
                    <div className="h-1 bg-[#e5e5e5] rounded-full mb-2 overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(0, ((qrData.expires - Date.now()) / (90 * 60 * 1000)) * 100)}%` }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={copierLien} className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#1a1a1a] transition-colors">
                      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      {copied ? "Copié !" : "Copier le lien"}
                    </button>
                    <span className="text-[#e5e5e5]">·</span>
                    <button onClick={() => setQrFullscreen(true)} className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#1a1a1a] transition-colors">
                      <Maximize2 size={12} />
                      Agrandir
                    </button>
                    {isExpired && (
                      <>
                        <span className="text-[#e5e5e5]">·</span>
                        <button onClick={genererQR} className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline">
                          <RefreshCw size={12} />
                          Régénérer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Ajout élève */}
            {showAdd && (
              <div className="px-5 pt-4 pb-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                {selected && selected.categorie !== "TOUS" && (
                  <p className="text-xs text-[#999999] mb-2">
                    {selected.categorie === "KIDS" ? "⭐ Affichage des élèves Enfants uniquement" : "🥋 Affichage des élèves Adultes uniquement"}
                  </p>
                )}
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" />
                  <input
                    value={searchAdd}
                    onChange={(e) => setSearchAdd(e.target.value)}
                    placeholder="Rechercher un élève à ajouter..."
                    className="w-full border border-[#e5e5e5] rounded-[8px] pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] bg-white placeholder:text-[#aaaaaa]"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {eligibles.slice(0, 20).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => ajouterPresence(e.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-left hover:bg-white hover:shadow-sm transition-all group"
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: "var(--color-primary)" }}>
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">{e.prenom} {e.nom}</p>
                      </div>
                      <CeintureBadge ceinture={e.ceinture} barrettes={e.barrettes} size="sm" />
                      <Plus size={14} className="text-[var(--color-primary)] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  {eligibles.length === 0 && (
                    <p className="text-xs text-[#aaaaaa] text-center py-3">Aucun élève disponible</p>
                  )}
                </div>
              </div>
            )}

            {/* Sort bar */}
            {presences.length > 1 && (
              <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[#f7f7f7] bg-[#fafafa]">
                <SortAsc size={13} className="text-[#aaaaaa]" />
                <span className="text-xs text-[#aaaaaa]">Trier par</span>
                {(["alpha", "ceinture"] as SortMode[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortMode(s)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      sortMode === s
                        ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-medium"
                        : "text-[#666666] hover:bg-[#f0f0f0]"
                    }`}
                  >
                    {s === "alpha" ? "Alphabétique" : "Ceinture"}
                  </button>
                ))}
              </div>
            )}

            {/* Liste des présents */}
            <div className="divide-y divide-[#f7f7f7]">
              {presencesSorted.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa] transition-colors group">
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
                    className="text-[#dddddd] hover:text-red-500 transition-colors p-1 flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Retirer la présence"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {presences.length === 0 && !showAdd && (
                <div className="py-14 text-center">
                  <Users size={36} className="mx-auto mb-3 text-[#e5e5e5]" />
                  <p className="text-sm text-[#aaaaaa]">Aucune présence enregistrée pour ce cours</p>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="mt-3 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    + Ajouter manuellement
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-[12px] shadow-sm flex items-center justify-center py-20">
            <div className="text-center">
              <Users size={44} className="mx-auto mb-3 text-[#eeeeee]" />
              <p className="text-sm font-medium text-[#cccccc]">Sélectionne un cours</p>
              <p className="text-xs text-[#dddddd] mt-1">pour voir et gérer les présences</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal QR plein écran ── */}
      {qrData && qrFullscreen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6" onClick={() => setQrFullscreen(false)}>
          <div className="bg-white rounded-[20px] p-10 text-center w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div className="text-left">
                <h2 className="font-bold text-[#1a1a1a] text-lg">QR Code</h2>
                {selected && (
                  <p className="text-sm text-[#666666] mt-0.5">{TYPES[selected.type]} · {JOURS[selected.jour]} {selected.heureDebut}</p>
                )}
              </div>
              <button onClick={() => setQrFullscreen(false)} className="text-[#aaaaaa] hover:text-[#666666] p-1">
                <Minimize2 size={20} />
              </button>
            </div>
            <img
              src={qrData.dataUrl}
              alt="QR Code"
              className={`mx-auto rounded-[12px] w-72 mb-4 ${isExpired ? "opacity-30 grayscale" : ""}`}
            />
            {!isExpired ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`text-2xl font-black tabular-nums ${countdown.startsWith("0:") ? "text-red-500" : "text-[#1a1a1a]"}`}>{countdown}</span>
                  <span className="text-sm text-[#999999]">restant</span>
                </div>
                <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, ((qrData.expires - Date.now()) / (90 * 60 * 1000)) * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-red-500 font-semibold mb-4">QR Code expiré</p>
            )}
            <div className="flex gap-2">
              <button onClick={copierLien} className="flex-1 flex items-center justify-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] py-2.5 text-sm hover:bg-[#f9f9f9] transition-colors">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
              {isExpired && (
                <button onClick={() => { genererQR(); setQrFullscreen(false); }} className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors">
                  <RefreshCw size={14} />
                  Régénérer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
