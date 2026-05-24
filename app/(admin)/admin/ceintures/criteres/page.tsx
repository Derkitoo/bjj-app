"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const CEINTURES = [
  { value: "BLEUE", label: "Bleue", color: "bg-blue-500" },
  { value: "VIOLETTE", label: "Violette", color: "bg-purple-500" },
  { value: "MARRON", label: "Marron", color: "bg-amber-800" },
  { value: "NOIRE", label: "Noire", color: "bg-gray-900" },
];

interface Critere {
  ceintureCible: string;
  minCours: number;
  minMois: number;
  description: string;
}

export default function CriteresCeinturesPage() {
  const [criteres, setCriteres] = useState<Critere[]>(
    CEINTURES.map((c) => ({ ceintureCible: c.value, minCours: 0, minMois: 0, description: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/ceintures/criteres")
      .then((r) => r.json())
      .then((data: Critere[]) => {
        if (data.length > 0) {
          setCriteres(
            CEINTURES.map((c) => {
              const found = data.find((d) => d.ceintureCible === c.value);
              return found ?? { ceintureCible: c.value, minCours: 0, minMois: 0, description: "" };
            })
          );
        }
      });
  }, []);

  const update = (index: number, field: keyof Critere, value: string | number) => {
    setCriteres((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/ceintures/criteres", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(criteres),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputClass = "border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] w-full";

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/ceintures" className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Critères de promotion</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        {CEINTURES.map((ceinture, i) => (
          <div key={ceinture.value} className="bg-white rounded-[12px] shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-4 h-4 rounded-full ${ceinture.color}`} />
              <h2 className="font-semibold text-[#1a1a1a]">Ceinture {ceinture.label}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Cours minimum</label>
                <input
                  type="number" min="0" value={criteres[i].minCours}
                  onChange={(e) => update(i, "minCours", parseInt(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Mois minimum</label>
                <input
                  type="number" min="0" value={criteres[i].minMois}
                  onChange={(e) => update(i, "minMois", parseInt(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Description (optionnel)</label>
              <textarea
                value={criteres[i].description}
                onChange={(e) => update(i, "description", e.target.value)}
                rows={2} placeholder="Ex: Maîtrise des positions de garde, des sweeps de base..."
                className={inputClass}
              />
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 pb-6">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            <Save size={15} />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Critères sauvegardés ✓</span>}
        </div>
      </form>
    </div>
  );
}
