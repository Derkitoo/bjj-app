"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NouvelElevePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "",
    dateNaissance: "", ceinture: "BLANCHE", notes: "",
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

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Une erreur est survenue");
      setLoading(false);
      return;
    }

    router.push("/admin/eleves");
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

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
              <input required value={form.prenom} onChange={set("prenom")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Nom *</label>
              <input required value={form.nom} onChange={set("nom")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email</label>
            <input type="email" value={form.email} onChange={set("email")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Téléphone</label>
            <input value={form.telephone} onChange={set("telephone")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Date de naissance</label>
            <input type="date" value={form.dateNaissance} onChange={set("dateNaissance")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Ceinture</label>
            <select value={form.ceinture} onChange={set("ceinture")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]">
              <option value="BLANCHE">Blanche</option>
              <option value="BLEUE">Bleue</option>
              <option value="VIOLETTE">Violette</option>
              <option value="MARRON">Marron</option>
              <option value="NOIRE">Noire</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
          </div>
          {error && <p className="text-[#ef4444] text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="bg-[#cc0000] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#aa0000] disabled:opacity-50 transition-colors">
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
