"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, UserCheck } from "lucide-react";

export default function NouvelElevePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultat, setResultat] = useState<{ eleveId: string; mdpTemporaire: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "",
    dateNaissance: "", ceinture: "BLANCHE", barrettes: 0, categorie: "ADULTES", notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setResultat({ eleveId: data.eleve.id, mdpTemporaire: data.mdpTemporaire });
    setLoading(false);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

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
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Élève ajouté</h1>
        </div>

        <div className="max-w-xl space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-[12px] p-5 flex items-start gap-4">
            <UserCheck size={22} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                {form.prenom} {form.nom} a bien été ajouté
              </p>
              {resultat.mdpTemporaire ? (
                <>
                  <p className="text-xs text-green-700 mt-1">Un compte a été créé avec le mot de passe temporaire ci-dessous. Communique-le à l&apos;élève.</p>
                  <div className="flex items-center justify-between bg-white border border-green-300 rounded-[8px] px-4 py-3 mt-3">
                    <span className="font-mono text-lg font-bold text-green-900">{resultat.mdpTemporaire}</span>
                    <button onClick={() => copier(resultat.mdpTemporaire!)} className="flex items-center gap-1.5 bg-green-700 text-white rounded-[6px] px-3 py-1.5 text-xs font-medium">
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-green-700 mt-1">Aucun email fourni — aucun compte créé. Tu pourras en créer un depuis la page Comptes.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/admin/eleves" className="bg-[var(--color-primary)] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors">
              Retour à la liste
            </Link>
            <button
              onClick={() => { setResultat(null); setForm({ nom: "", prenom: "", email: "", telephone: "", dateNaissance: "", ceinture: "BLANCHE", barrettes: 0, categorie: "ADULTES", notes: "" }); }}
              className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
            >
              Ajouter un autre élève
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

      <div className="bg-white rounded-[12px] shadow-sm p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Prénom *</label>
              <input required value={form.prenom} onChange={set("prenom")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Nom *</label>
              <input required value={form.nom} onChange={set("nom")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="Un compte sera créé automatiquement" className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[#aaaaaa]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Téléphone</label>
            <input value={form.telephone} onChange={set("telephone")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Date de naissance</label>
            <input type="date" value={form.dateNaissance} onChange={set("dateNaissance")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Catégorie</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: "ADULTES", label: "🥋 Adultes", sub: "14 ans et +" }, { v: "KIDS", label: "⭐ Enfants", sub: "8 à 13 ans" }].map(({ v, label, sub }) => (
                <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, categorie: v }))}
                  className={`py-2 px-3 rounded-[8px] border-2 text-left transition-colors ${form.categorie === v ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]" : "border-[#e5e5e5] hover:border-[#cccccc]"}`}>
                  <p className={`text-sm font-semibold ${form.categorie === v ? "text-[var(--color-primary)]" : "text-[#1a1a1a]"}`}>{label}</p>
                  <p className="text-[10px] text-[#999999]">{sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Ceinture</label>
            <select value={form.ceinture} onChange={set("ceinture")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]">
              <option value="BLANCHE">Blanche</option>
              <option value="BLEUE">Bleue</option>
              <option value="VIOLETTE">Violette</option>
              <option value="MARRON">Marron</option>
              <option value="NOIRE">Noire</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Barrettes (0 à 4)</label>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, barrettes: Math.max(0, f.barrettes - 1) }))}
                className="w-8 h-8 rounded-full border border-[#e5e5e5] text-lg font-bold text-[#666666] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center">−</button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span key={i} className={`w-3 h-5 rounded-sm ${i < form.barrettes ? "bg-[var(--color-primary)]" : "bg-[#e5e5e5]"}`} />
                ))}
              </div>
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, barrettes: Math.min(4, f.barrettes + 1) }))}
                className="w-8 h-8 rounded-full border border-[#e5e5e5] text-lg font-bold text-[#666666] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center">+</button>
              <span className="text-sm text-[#666666]">{form.barrettes}/4</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          {error && <p className="text-[#ef4444] text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="bg-[var(--color-primary)] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
              {loading ? "Enregistrement..." : "Ajouter l'élève"}
            </button>
            <Link href="/admin/eleves" className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition-colors">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
