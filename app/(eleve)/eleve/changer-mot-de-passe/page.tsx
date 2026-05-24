"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { ShieldCheck } from "lucide-react";

export default function ChangerMotDePassePage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ ancienMdp: "", nouveauMdp: "", confirmer: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.nouveauMdp !== form.confirmer) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (form.nouveauMdp.length < 8) {
      setError("Le nouveau mot de passe doit faire au moins 8 caractères");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/eleve/changer-mot-de-passe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ancienMdp: form.ancienMdp, nouveauMdp: form.nouveauMdp }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    // Re-authenticate to get a fresh JWT with motDePasseTemporaire: false
    await signIn("credentials", {
      email: session?.user?.email,
      password: form.nouveauMdp,
      callbackUrl: "/eleve/accueil",
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-orange-50 border border-orange-200 rounded-[12px] p-4 mb-6 flex items-start gap-3">
        <ShieldCheck size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-orange-800">Changement de mot de passe requis</p>
          <p className="text-xs text-orange-600 mt-1">Tu utilises un mot de passe temporaire. Choisis un nouveau mot de passe pour sécuriser ton compte.</p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm p-6">
        <h1 className="text-lg font-bold text-[#1a1a1a] mb-5">Changer mon mot de passe</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Mot de passe temporaire</label>
            <input type="password" required value={form.ancienMdp} onChange={set("ancienMdp")}
              className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Nouveau mot de passe</label>
            <input type="password" required value={form.nouveauMdp} onChange={set("nouveauMdp")}
              className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
            <p className="text-xs text-[#666666] mt-1">8 caractères minimum</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Confirmer le mot de passe</label>
            <input type="password" required value={form.confirmer} onChange={set("confirmer")}
              className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
          </div>
          {error && <p className="text-[#ef4444] text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#cc0000] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[#aa0000] disabled:opacity-50 transition-colors">
            {loading ? "Enregistrement..." : "Changer mon mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
