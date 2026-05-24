"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  eleveId: string;
  nom: string;
  ceinture: string;
  barrettes: number;
  nextBelt: string | null;
  eligible: boolean;
}

const LABELS: Record<string, string> = { BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire" };

export default function CeintureActions({ eleveId, nom, ceinture, barrettes: initialBarrettes, nextBelt, eligible }: Props) {
  const router = useRouter();
  const [barrettes, setBarrettes] = useState(initialBarrettes);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const changerBarrette = async (delta: number) => {
    const res = await fetch("/api/ceintures/barrettes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eleveId, delta }),
    });
    const data = await res.json();
    setBarrettes(data.barrettes);
  };

  const promouvoir = async () => {
    setLoading(true);
    await fetch("/api/ceintures/promouvoir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eleveId, nouvelleCeinture: nextBelt }),
    });
    setShowConfirm(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Barrettes */}
      {ceinture !== "NOIRE" && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changerBarrette(-1)}
            disabled={barrettes === 0}
            className="w-6 h-6 rounded-full border border-[#e5e5e5] text-sm font-bold text-[#666666] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >−</button>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className={`w-2 h-3.5 rounded-sm transition-colors ${i < barrettes ? "bg-[var(--color-primary)]" : "bg-[#e5e5e5]"}`} />
            ))}
          </div>
          <button
            onClick={() => changerBarrette(1)}
            disabled={barrettes === 4}
            className="w-6 h-6 rounded-full border border-[#e5e5e5] text-sm font-bold text-[#666666] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >+</button>
        </div>
      )}

      {/* Promotion */}
      {nextBelt && (
        <button
          onClick={() => setShowConfirm(true)}
          className={`rounded-[8px] px-3 py-1 text-xs font-medium transition-colors border ${
            eligible
              ? "border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
              : "border-[#e5e5e5] text-[#999999] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          }`}
        >
          {eligible ? "⭐ Promouvoir" : "Promouvoir"}
        </button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] p-6 max-w-sm w-full mx-4 text-center">
            <p className="text-lg font-bold text-[#1a1a1a] mb-2">Confirmer la promotion</p>
            <p className="text-sm text-[#666666] mb-1">
              Promouvoir <strong>{nom}</strong> à la ceinture <strong>{LABELS[nextBelt!] || nextBelt}</strong> ?
            </p>
            <p className="text-xs text-[#999999] mb-5">Les barrettes seront remises à zéro.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={promouvoir} disabled={loading}
                className="bg-[var(--color-primary)] text-white rounded-[8px] px-5 py-2 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                {loading ? "..." : "Confirmer"}
              </button>
              <button onClick={() => setShowConfirm(false)}
                className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2 text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
