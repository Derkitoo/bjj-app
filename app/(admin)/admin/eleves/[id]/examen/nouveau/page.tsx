"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";

const CEINTURES = [
  { value: "BLEUE",    label: "🔵 Bleue" },
  { value: "VIOLETTE", label: "🟣 Violette" },
  { value: "MARRON",   label: "🟤 Marron" },
  { value: "NOIRE",    label: "⚫ Noire" },
];

const inputClass = "w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]";
const labelClass = "block text-sm font-medium text-[#1a1a1a] mb-1";

export default function NouvelExamenPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [ceintureCible, setCeintureCible] = useState("BLEUE");
  const [date, setDate] = useState("");
  const [techniques, setTechniques] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ajouterTechnique = () => setTechniques((t) => [...t, ""]);
  const supprimerTechnique = (i: number) => setTechniques((t) => t.filter((_, idx) => idx !== i));
  const modifierTechnique = (i: number, val: string) =>
    setTechniques((t) => t.map((v, idx) => (idx === i ? val : v)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const noms = techniques.map((t) => t.trim()).filter(Boolean);
    if (noms.length === 0) {
      setError("Ajoutez au moins une technique.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/examens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eleveId: id,
        ceintureCible,
        date: date || null,
        techniques: noms.map((nom) => ({ nom })),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de la création");
      setLoading(false);
      return;
    }
    const examen = await res.json();
    router.push(`/admin/eleves/${id}/examen/${examen.id}`);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/eleves/${id}`} className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Créer un examen</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div className="bg-white rounded-[12px] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a] border-b border-[#e5e5e5] pb-3">Informations</h2>

          <div>
            <label className={labelClass}>Ceinture visée</label>
            <div className="grid grid-cols-2 gap-2">
              {CEINTURES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCeintureCible(c.value)}
                  className={`py-2.5 px-3 rounded-[8px] border-2 text-sm font-medium text-left transition-colors ${
                    ceintureCible === c.value
                      ? "border-[#cc0000] bg-[#fff0f0] text-[#cc0000]"
                      : "border-[#e5e5e5] text-[#666666] hover:border-[#cccccc]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Date de l&apos;examen (facultatif)</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <h2 className="font-semibold text-[#1a1a1a]">Techniques à évaluer</h2>
            <span className="text-xs text-[#999999]">{techniques.filter(Boolean).length} technique{techniques.filter(Boolean).length > 1 ? "s" : ""}</span>
          </div>

          <div className="space-y-2">
            {techniques.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <GripVertical size={14} className="text-[#cccccc] flex-shrink-0" />
                <input
                  value={t}
                  onChange={(e) => modifierTechnique(i, e.target.value)}
                  placeholder={`Technique ${i + 1}…`}
                  className={inputClass + " placeholder:text-[#aaaaaa]"}
                />
                {techniques.length > 1 && (
                  <button
                    type="button"
                    onClick={() => supprimerTechnique(i)}
                    className="text-[#cccccc] hover:text-[#ef4444] flex-shrink-0 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={ajouterTechnique}
            className="flex items-center gap-2 text-sm text-[#cc0000] hover:text-[#aa0000] transition-colors"
          >
            <Plus size={15} />
            Ajouter une technique
          </button>
        </div>

        {error && <p className="text-[#ef4444] text-sm">{error}</p>}

        <div className="flex gap-3 pb-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#cc0000] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#aa0000] disabled:opacity-50 transition-colors"
          >
            {loading ? "Création..." : "Créer l'examen"}
          </button>
          <Link
            href={`/admin/eleves/${id}`}
            className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
