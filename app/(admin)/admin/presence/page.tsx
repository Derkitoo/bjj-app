"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  QrCode, Users, CheckCircle, BarChart2, Search, X,
  Copy, Check, RefreshCw, Clock, Maximize2, Minimize2,
} from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  ceinture: string;
  barrettes: number;
  actif: boolean;
}

interface Cours {
  id: string;
  type: string;
  heureDebut: string;
  duree: number;
  jour: number;
  annule: boolean;
  titre: string | null;
}

const JOURS_LABEL: Record<number, string> = { 0: "Dimanche", 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi" };
const TYPES: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Kids", COMPETITION: "Compétition", OPEN_MAT: "Open Mat" };
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  GI:          { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", dot: "#3b82f6" },
  NO_GI:       { bg: "#ede9fe", border: "#c4b5fd", text: "#6d28d9", dot: "#8b5cf6" },
  KIDS:        { bg: "#dcfce7", border: "#86efac", text: "#166534", dot: "#22c55e" },
  COMPETITION: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", dot: "#ef4444" },
  OPEN_MAT:    { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569", dot: "#94a3b8" },
};

const formatDuree = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}h${m}` : `${h}h`) : `${min}min`;
};

function isEnCours(c: Cours): boolean {
  const now = new Date();
  if (c.jour !== now.getDay()) return false;
  const [h, m] = c.heureDebut.split(":").map(Number);
  const start = h * 60 + m;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= start && nowMin < start + c.duree;
}

function countdownStr(expires: number): string {
  const diff = Math.max(0, expires - Date.now());
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PresencePage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [presences, setPresences] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"tablette" | "liste">("tablette");
  const [search, setSearch] = useState("");
  const [trierPresents, setTrierPresents] = useState(false);
  const [qrData, setQrData] = useState<{ url: string; dataUrl: string; expires: number; token: string } | null>(null);
  const [countdown, setCountdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/eleves").then((r) => r.json()).then((data: Eleve[]) => setEleves(data.filter((e) => e.actif)));
    fetch("/api/cours").then((r) => r.json()).then((data: Cours[]) => {
      const actifs = data.filter((c) => !c.annule);
      setCours(actifs);
      const enCours = actifs.find(isEnCours);
      if (enCours) setSelectedId(enCours.id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/presences?coursId=${selectedId}`)
      .then((r) => r.json())
      .then((data: { eleveId: string }[]) => setPresences(new Set(data.map((p) => p.eleveId))));
  }, [selectedId]);

  useEffect(() => {
    if (!qrData) { if (timerRef.current) clearInterval(timerRef.current); return; }
    setCountdown(countdownStr(qrData.expires));
    timerRef.current = setInterval(() => {
      setCountdown(countdownStr(qrData.expires));
      if (Date.now() >= qrData.expires) { clearInterval(timerRef.current!); }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qrData]);

  const genererQR = async () => {
    if (!selectedId) return;
    setLoadingQR(true);
    const res = await fetch("/api/presences/qrcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coursId: selectedId }),
    });
    const data = await res.json();
    const url = `${window.location.origin}/eleve/accueil?token=${data.token}`;
    setQrData({ url, dataUrl: data.qrDataUrl, expires: data.expires, token: data.token });
    setLoadingQR(false);
  };

  const togglePresence = async (eleveId: string) => {
    const estPresent = presences.has(eleveId);
    setPresences((prev) => {
      const next = new Set(prev);
      estPresent ? next.delete(eleveId) : next.add(eleveId);
      return next;
    });
    await fetch("/api/presences/manuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eleveId, coursId: selectedId, retirer: estPresent }),
    });
  };

  const copierLien = async () => {
    if (!qrData) return;
    await navigator.clipboard.writeText(qrData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selected = cours.find((c) => c.id === selectedId);
  const isExpired = qrData ? Date.now() >= qrData.expires : false;

  const groupedCours = [1, 2, 3, 4, 5, 6, 0].reduce<Record<number, Cours[]>>((acc, j) => {
    const cs = cours.filter((c) => c.jour === j).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    if (cs.length) acc[j] = cs;
    return acc;
  }, {});

  const elevesAffiches = eleves
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (trierPresents) {
        const aP = presences.has(a.id) ? 0 : 1;
        const bP = presences.has(b.id) ? 0 : 1;
        if (aP !== bP) return aP - bP;
      }
      return a.nom.localeCompare(b.nom);
    });

  const s = selected ? (TYPE_COLORS[selected.type] ?? TYPE_COLORS.OPEN_MAT) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Présence</h1>
        <Link
          href="/admin/presence/cours"
          className="flex items-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
        >
          <BarChart2 size={15} />
          <span className="hidden sm:inline">Historique par cours</span>
          <span className="sm:hidden">Historique</span>
        </Link>
      </div>

      {/* ── Sélection du cours ── */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">Choisir le cours</p>
        <div className="space-y-3">
          {Object.entries(groupedCours).map(([jourStr, coursDuJour]) => {
            const jour = Number(jourStr);
            return (
              <div key={jour}>
                <p className="text-xs font-medium text-[#aaaaaa] mb-2 ml-1">{JOURS_LABEL[jour]}</p>
                <div className="flex flex-wrap gap-2">
                  {coursDuJour.map((c) => {
                    const active = c.id === selectedId;
                    const enCours = isEnCours(c);
                    const sc = TYPE_COLORS[c.type] ?? TYPE_COLORS.OPEN_MAT;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] border-2 text-sm font-medium transition-all ${
                          active
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                            : "border-transparent bg-white shadow-sm hover:border-[#e5e5e5] text-[#1a1a1a]"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot }} />
                        <span>{TYPES[c.type]}</span>
                        <span className={`text-xs ${active ? "text-[var(--color-primary-dark)]" : "text-[#999999]"}`}>
                          {c.heureDebut} · {formatDuree(c.duree)}
                        </span>
                        {enCours && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            En cours
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {cours.length === 0 && (
            <p className="text-sm text-[#aaaaaa]">Aucun cours programmé.</p>
          )}
        </div>
      </div>

      {selected && s && (
        <>
          {/* ── Barre d'actions ── */}
          <div
            className="rounded-[12px] px-5 py-4 mb-4 flex flex-wrap items-center gap-3 border"
            style={{ backgroundColor: s.bg, borderColor: s.border }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: s.text }}>
                {TYPES[selected.type]}
                {selected.titre && <span className="font-normal opacity-70"> · {selected.titre}</span>}
              </p>
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: s.text, opacity: 0.7 }}>
                <Clock size={11} />
                {JOURS_LABEL[selected.jour]} · {selected.heureDebut} · {formatDuree(selected.duree)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: s.text }}>
              <CheckCircle size={15} />
              {presences.size} / {eleves.length}
              <span className="text-xs font-normal opacity-70">présents</span>
            </div>

            <button
              onClick={genererQR}
              disabled={loadingQR}
              className="flex items-center gap-2 text-white rounded-[8px] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor: s.text === "#ffffff" ? "rgba(0,0,0,0.2)" : "var(--color-primary)", color: s.text }}
            >
              {loadingQR ? <RefreshCw size={15} className="animate-spin" /> : <QrCode size={15} />}
              QR Code
            </button>

            <button
              onClick={() => setMode(mode === "tablette" ? "liste" : "tablette")}
              className="flex items-center gap-2 rounded-[8px] px-4 py-2 text-sm font-medium transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.25)", color: s.text }}
            >
              <Users size={15} />
              {mode === "tablette" ? "Vue liste" : "Vue tablette"}
            </button>
          </div>

          {/* ── Outils mode liste ── */}
          {mode === "liste" && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un élève..."
                  className="w-full border border-[#e5e5e5] rounded-[8px] pl-9 pr-8 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[#aaaaaa]"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaaaaa] hover:text-[#666666]">
                    <X size={13} />
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-[#666666] cursor-pointer select-none">
                <input type="checkbox" checked={trierPresents} onChange={(e) => setTrierPresents(e.target.checked)} className="accent-[var(--color-primary)]" />
                Présents en premier
              </label>
            </div>
          )}

          {/* ── Mode tablette ── */}
          {mode === "tablette" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {eleves.map((eleve) => {
                const present = presences.has(eleve.id);
                return (
                  <button
                    key={eleve.id}
                    onClick={() => togglePresence(eleve.id)}
                    className={`bg-white rounded-[14px] shadow-sm p-4 text-center transition-all border-2 active:scale-95 ${
                      present ? "border-green-400 bg-green-50 shadow-green-100" : "border-transparent hover:border-[#e5e5e5] hover:shadow-md"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2.5 flex items-center justify-center text-base font-bold transition-all ${
                      present ? "bg-green-500 text-white scale-110" : "text-white"
                    }`}
                      style={!present ? { backgroundColor: "var(--color-primary)" } : {}}
                    >
                      {present
                        ? <CheckCircle size={22} className="text-white" />
                        : <span>{eleve.prenom[0]}{eleve.nom[0]}</span>
                      }
                    </div>
                    <p className={`text-xs font-semibold truncate ${present ? "text-green-700" : "text-[#1a1a1a]"}`}>{eleve.prenom}</p>
                    <p className={`text-xs truncate mb-1.5 ${present ? "text-green-600" : "text-[#666666]"}`}>{eleve.nom}</p>
                    <div className="flex justify-center">
                      <CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} size="sm" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Mode liste ── */}
          {mode === "liste" && (
            <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Élève</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden sm:table-cell">Ceinture</th>
                    <th className="text-center text-xs font-semibold text-[#666666] px-4 py-3 w-24">Présent</th>
                  </tr>
                </thead>
                <tbody>
                  {elevesAffiches.map((eleve, i) => {
                    const present = presences.has(eleve.id);
                    return (
                      <tr
                        key={eleve.id}
                        onClick={() => togglePresence(eleve.id)}
                        className={`border-b border-[#f5f5f5] cursor-pointer transition-colors ${
                          present ? "bg-green-50 hover:bg-green-100" : i % 2 === 0 ? "hover:bg-[#f9f9f9]" : "bg-[#fafafa] hover:bg-[#f3f3f3]"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-[#1a1a1a]">
                          {eleve.prenom} {eleve.nom}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className={`w-8 h-8 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                            present ? "bg-green-500 border-green-500 scale-110" : "border-[#e5e5e5] hover:border-green-400"
                          }`}>
                            {present && <Check size={14} className="text-white" strokeWidth={3} />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {elevesAffiches.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-[#aaaaaa] text-sm py-8">
                        {search ? `Aucun résultat pour "${search}"` : "Aucun élève actif"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Modal QR Code ── */}
      {qrData && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => { setQrData(null); setQrFullscreen(false); }}
        >
          <div
            className={`bg-white rounded-[16px] shadow-2xl text-center transition-all ${qrFullscreen ? "w-full max-w-2xl p-10" : "w-full max-w-sm p-7"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <h2 className="font-bold text-[#1a1a1a]">QR Code</h2>
                {selected && (
                  <p className="text-xs text-[#666666] mt-0.5">
                    {TYPES[selected.type]} · {JOURS_LABEL[selected.jour]} {selected.heureDebut}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQrFullscreen((v) => !v)}
                  className="text-[#aaaaaa] hover:text-[#666666] p-1 transition-colors"
                  title={qrFullscreen ? "Réduire" : "Plein écran"}
                >
                  {qrFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button
                  onClick={() => { setQrData(null); setQrFullscreen(false); }}
                  className="text-[#aaaaaa] hover:text-[#666666] p-1 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* QR image */}
            <div className={`relative inline-block mb-4 ${isExpired ? "opacity-30 grayscale" : ""}`}>
              <img
                src={qrData.dataUrl}
                alt="QR Code"
                className={`mx-auto rounded-[12px] ${qrFullscreen ? "w-72" : "w-52"}`}
              />
            </div>

            {/* Countdown */}
            {!isExpired ? (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock size={14} className="text-[#666666]" />
                  <span className="text-sm text-[#666666]">Expire dans</span>
                  <span className={`text-lg font-bold tabular-nums ${
                    countdown.startsWith("0:") || (countdown.startsWith("1:") && parseInt(countdown.split(":")[1]) < 60)
                      ? "text-red-500" : "text-[#1a1a1a]"
                  }`}>
                    {countdown}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, ((qrData.expires - Date.now()) / (90 * 60 * 1000)) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4 bg-red-50 rounded-[10px] p-3">
                <p className="text-sm font-semibold text-red-700">QR Code expiré</p>
                <p className="text-xs text-red-500 mt-0.5">Génère-en un nouveau pour la session</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={copierLien}
                className="flex-1 flex items-center justify-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-3 py-2 text-sm hover:bg-[#f9f9f9] transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
              {isExpired && (
                <button
                  onClick={genererQR}
                  className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-3 py-2 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
                >
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
