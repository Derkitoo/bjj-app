"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, UserCheck } from "lucide-react";
import EleveWizard, { type EleveFormData } from "@/components/EleveWizard";

export default function NouvelElevePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultat, setResultat] = useState<{ eleveId: string; nom: string; prenom: string; mdpTemporaire: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (form: EleveFormData) => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/eleves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Une erreur est survenue");
      setLoading(false);
      return;
    }
    setResultat({ eleveId: data.eleve.id, nom: form.nom, prenom: form.prenom, mdpTemporaire: data.mdpTemporaire });
    setLoading(false);
  };

  const copier = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (resultat) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/eleves" className="text-[#666666] hover:text-[#1a1a1a]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Élève ajouté ✓</h1>
        </div>

        <div className="max-w-xl space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-[12px] p-5 flex items-start gap-4">
            <UserCheck size={22} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                {resultat.prenom} {resultat.nom} a bien été ajouté
              </p>
              {resultat.mdpTemporaire ? (
                <>
                  <p className="text-xs text-green-700 mt-1">
                    Un compte a été créé avec le mot de passe temporaire ci-dessous. Communique-le à l&apos;élève.
                  </p>
                  <div className="flex items-center justify-between bg-white border border-green-300 rounded-[8px] px-4 py-3 mt-3">
                    <span className="font-mono text-lg font-bold text-green-900">{resultat.mdpTemporaire}</span>
                    <button onClick={() => copier(resultat.mdpTemporaire!)}
                      className="flex items-center gap-1.5 bg-green-700 text-white rounded-[6px] px-3 py-1.5 text-xs font-medium">
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-green-700 mt-1">
                  Aucun email fourni — aucun compte créé. Tu pourras en créer un depuis la page Comptes.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/eleves"
              className="bg-[var(--color-primary)] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Retour à la liste
            </Link>
            <Link
              href={`/admin/eleves/${resultat.eleveId}`}
              className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
            >
              Voir la fiche
            </Link>
            <button
              onClick={() => setResultat(null)}
              className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
            >
              Ajouter un autre
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/eleves" className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Nouvel élève</h1>
      </div>

      <EleveWizard
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        submitLabel="Ajouter l'élève"
      />
    </div>
  );
}
