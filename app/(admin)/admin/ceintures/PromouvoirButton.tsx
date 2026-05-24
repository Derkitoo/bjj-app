"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  eleveId: string;
  nouvelleCeinture: string;
  nom: string;
}

const LABELS: Record<string, string> = { BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire" };

export default function PromouvoirButton({ eleveId, nouvelleCeinture, nom }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const promouvoir = async () => {
    setLoading(true);
    await fetch("/api/ceintures/promouvoir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eleveId, nouvelleCeinture }),
    });
    setShowConfirm(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="border border-[#cc0000] text-[#cc0000] rounded-[8px] px-3 py-1 text-xs font-medium hover:bg-[#cc0000] hover:text-white transition-colors"
      >
        Promouvoir
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] p-6 max-w-sm w-full mx-4 text-center">
            <p className="text-lg font-bold text-[#1a1a1a] mb-2">Confirmer la promotion</p>
            <p className="text-sm text-[#666666] mb-5">
              Promouvoir <strong>{nom}</strong> à la ceinture <strong>{LABELS[nouvelleCeinture] || nouvelleCeinture}</strong> ?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={promouvoir}
                disabled={loading}
                className="bg-[#cc0000] text-white rounded-[8px] px-5 py-2 text-sm font-medium hover:bg-[#aa0000] disabled:opacity-50"
              >
                {loading ? "..." : "Confirmer"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
