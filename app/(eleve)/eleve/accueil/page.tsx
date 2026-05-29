"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { QrCode, CheckCircle, Calendar, TrendingUp, Zap, Clock, ClipboardList, ChevronRight } from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";
import { useSearchParams, useRouter } from "next/navigation";
import { useCountUp } from "@/hooks/useCountUp";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

const BELT_BG: Record<string, { from: string; to: string; text: string }> = {
  BLANCHE:  { from: "#f0f0f0", to: "#e0e0e0", text: "#1a1a1a" },
  BLEUE:    { from: "#1d4ed8", to: "#1e3a8a", text: "#ffffff" },
  VIOLETTE: { from: "#7c3aed", to: "#5b21b6", text: "#ffffff" },
  MARRON:   { from: "#92400e", to: "#78350f", text: "#ffffff" },
  NOIRE:    { from: "#1a1a1a", to: "#000000", text: "#ffffff" },
};

const BELT_LABELS: Record<string, string> = {
  BLANCHE: "Blanche", BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire",
};

const CEINTURE_EMOJI: Record<string, string> = {
  BLEUE: "🔵", VIOLETTE: "🟣", MARRON: "🟤", NOIRE: "⚫",
};

interface ProfilData {
  nom: string;
  prenom: string;
  ceinture: string;
  barrettes: number;
  totalPresences: number;
  presencesMois: number;
  nextBelt: string | null;
  progression: number;
  derniereCours: { date: string; type: string } | null;
  prochainCours: { jour: string; heure: string; type: string; daysUntil: number; duree: number } | null;
  examenEnCours: { id: string; ceintureCible: string; nbMaitrises: number; total: number } | null;
}

function ProgressRing({ pct, size = 100 }: { pct: number; size?: number }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="7"
        strokeDasharray={`${filled} ${c}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

function AccueilContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null);
  const [scanMessage, setScanMessage] = useState("");

  const totalCount = useCountUp(profil?.totalPresences ?? 0);
  const moisCount = useCountUp(profil?.presencesMois ?? 0);

  useEffect(() => {
    fetch("/api/eleve/profil").then((r) => r.json()).then(setProfil).catch(() => {});
  }, []);

  const handleScan = useCallback(async (token: string) => {
    setScanning(true);
    const res = await fetch("/api/presences/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (res.ok) {
      setScanResult("success");
      setScanMessage("Présence enregistrée !");
      router.replace("/eleve/accueil");
    } else {
      setScanResult("error");
      setScanMessage(data.error || "Erreur lors du scan");
    }
    setScanning(false);
  }, [router]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) handleScan(token);
  }, [searchParams, handleScan]);

  const belt = profil?.ceinture ?? "BLANCHE";
  const beltStyle = BELT_BG[belt] ?? BELT_BG.BLANCHE;
  const isLight = belt === "BLANCHE";

  return (
    <div className="space-y-4 pb-4">

      {/* ── Hero ── */}
      {profil && (
        <div
          className="rounded-[20px] p-6 relative overflow-hidden animate-fade-up"
          style={{ background: `linear-gradient(135deg, ${beltStyle.from}, ${beltStyle.to})` }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />

          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)" }}>
                Bonjour 👋
              </p>
              <h1 className="text-2xl font-bold mb-2" style={{ color: beltStyle.text }}>
                {profil.prenom} {profil.nom}
              </h1>
              <CeintureBadge ceinture={profil.ceinture} barrettes={profil.barrettes} size="sm" />
              <p className="text-xs mt-2 font-medium" style={{ color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.6)" }}>
                {profil.totalPresences} cours effectués
              </p>
            </div>

            {profil.nextBelt && (
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative">
                  <ProgressRing pct={profil.progression} size={84} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold" style={{ color: beltStyle.text }}>{profil.progression}%</span>
                  </div>
                </div>
                <p className="text-[10px] mt-1 font-medium" style={{ color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.6)" }}>
                  vers {BELT_LABELS[profil.nextBelt]}
                </p>
              </div>
            )}

            {!profil.nextBelt && (
              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full flex-shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <span className="text-2xl">🏆</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {profil && (
        <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="bg-white rounded-[16px] shadow-sm p-4 text-center">
            <div className="flex items-center justify-center mb-1" style={{ color: "var(--color-primary)" }}>
              <TrendingUp size={18} />
            </div>
            <p className="text-3xl font-bold text-[#1a1a1a]">{totalCount}</p>
            <p className="text-xs mt-0.5 text-[#666666]">Cours au total</p>
          </div>
          <div className="bg-white rounded-[16px] shadow-sm p-4 text-center">
            <div className="flex items-center justify-center mb-1" style={{ color: "var(--color-primary)" }}>
              <Zap size={18} />
            </div>
            <p className="text-3xl font-bold text-[#1a1a1a]">{moisCount}</p>
            <p className="text-xs mt-0.5 text-[#666666]">Ce mois-ci</p>
          </div>
        </div>
      )}

      {/* ── Prochaine séance ── */}
      {profil?.prochainCours && (
        <div className="bg-white rounded-[16px] shadow-sm p-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary-subtle)" }}>
                <Calendar size={18} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p className="text-xs text-[#999999] font-medium uppercase tracking-wide">Prochaine séance</p>
                <p className="font-bold text-[#1a1a1a] mt-0.5">
                  {profil.prochainCours.daysUntil === 0
                    ? "Aujourd'hui"
                    : profil.prochainCours.daysUntil === 1
                    ? "Demain"
                    : profil.prochainCours.jour}
                  {" · "}{profil.prochainCours.heure}
                </p>
                <p className="text-xs text-[#666666] mt-0.5">
                  {profil.prochainCours.type} · {profil.prochainCours.duree} min
                </p>
              </div>
            </div>
            {profil.prochainCours.daysUntil === 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                Ce soir
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Dernière présence ── */}
      {profil?.derniereCours && (
        <div className="bg-white rounded-[16px] shadow-sm p-5 animate-fade-up" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f5f5f5]">
              <Clock size={18} className="text-[#666666]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#999999] font-medium uppercase tracking-wide">Dernière présence</p>
              <p className="font-semibold text-[#1a1a1a] mt-0.5">
                {format(new Date(profil.derniereCours.date), "EEEE d MMMM", { locale: fr })}
              </p>
              <p className="text-xs text-[#999999] mt-0.5">
                {profil.derniereCours.type}
                {" · "}
                {(() => {
                  const days = differenceInDays(new Date(), new Date(profil.derniereCours!.date));
                  if (days === 0) return "Aujourd'hui";
                  if (days === 1) return "Hier";
                  return `il y a ${days} jours`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Examen en cours ── */}
      {profil?.examenEnCours && (
        <Link
          href="/eleve/examens"
          className="block bg-white rounded-[16px] shadow-sm p-5 animate-fade-up hover:shadow-md transition-shadow"
          style={{ animationDelay: "180ms" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#fff7ed" }}>
              <ClipboardList size={18} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#999999] font-medium uppercase tracking-wide">Examen en cours</p>
              <p className="font-bold text-[#1a1a1a] mt-0.5">
                Ceinture {CEINTURE_EMOJI[profil.examenEnCours.ceintureCible]}{" "}
                {profil.examenEnCours.ceintureCible.charAt(0) + profil.examenEnCours.ceintureCible.slice(1).toLowerCase()}
              </p>
              {profil.examenEnCours.total > 0 && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-xs text-[#999999] mb-1">
                    <span>{profil.examenEnCours.nbMaitrises}/{profil.examenEnCours.total} techniques maîtrisées</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${(profil.examenEnCours.nbMaitrises / profil.examenEnCours.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <ChevronRight size={16} className="text-[#cccccc] flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* ── QR Scan ── */}
      <div className="bg-white rounded-[16px] shadow-sm p-6 animate-fade-up" style={{ animationDelay: "220ms" }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: "var(--color-primary-subtle)" }}>
            <QrCode size={26} style={{ color: "var(--color-primary)" }} />
          </div>
          <h2 className="font-bold text-[#1a1a1a] mb-1">Pointer ma présence</h2>
          <p className="text-sm text-[#666666] mb-4">Scanne le QR Code affiché par ton professeur</p>

          {scanResult === "success" && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-[10px] px-4 py-3 mb-3 w-full justify-center">
              <CheckCircle size={18} />
              <span className="text-sm font-semibold">{scanMessage}</span>
            </div>
          )}
          {scanResult === "error" && (
            <div className="text-red-600 bg-red-50 rounded-[10px] px-4 py-3 mb-3 text-sm w-full text-center">
              {scanMessage}
            </div>
          )}
          {scanning && (
            <div className="flex items-center gap-2 text-sm w-full justify-center mb-3" style={{ color: "var(--c-text-2)" }}>
              <div className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--color-primary-subtle)", borderTopColor: "var(--color-primary)" }} />
              Enregistrement...
            </div>
          )}
          <p className="text-xs text-[#999999]">Le scan se fait automatiquement quand tu ouvres le lien du QR Code</p>
        </div>
      </div>

    </div>
  );
}

export default function AccueilPage() {
  return (
    <Suspense>
      <AccueilContent />
    </Suspense>
  );
}
