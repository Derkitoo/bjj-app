"use client";

import { useState, useEffect } from "react";
import { UserCog, RefreshCw, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Compte {
  id: string;
  email: string;
  role: string;
  actif: boolean;
  motDePasseTemporaire: boolean;
  createdAt: string;
  eleve: { nom: string; prenom: string; ceinture: string } | null;
}

export default function ComptesPage() {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [mdpReset, setMdpReset] = useState<{ id: string; mdp: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/comptes").then((r) => r.json()).then(setComptes);
  }, []);

  const resetMdp = async (id: string) => {
    const res = await fetch(`/api/comptes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const data = await res.json();
    setMdpReset({ id, mdp: data.mdpTemporaire });
    setComptes((prev) => prev.map((c) => c.id === id ? { ...c, motDePasseTemporaire: true } : c));
  };

  const toggleActif = async (id: string) => {
    await fetch(`/api/comptes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle" }),
    });
    setComptes((prev) => prev.map((c) => c.id === id ? { ...c, actif: !c.actif } : c));
  };

  const copier = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Gestion des comptes</h1>
      </div>

      {mdpReset && (
        <div className="bg-green-50 border border-green-200 rounded-[12px] p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">Mot de passe temporaire généré</p>
            <p className="text-lg font-bold text-green-900 font-mono mt-1">{mdpReset.mdp}</p>
            <p className="text-xs text-green-600 mt-1">Communique ce mot de passe à l&apos;élève — il devra le changer à la connexion</p>
          </div>
          <button onClick={() => copier(mdpReset.mdp)} className="flex items-center gap-2 bg-green-700 text-white rounded-[8px] px-3 py-2 text-sm">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Compte</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Rôle</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3 hidden md:table-cell">Créé le</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Statut</th>
              <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {comptes.map((c, i) => (
              <tr key={c.id} className={`border-b border-[#e5e5e5] ${i % 2 === 0 ? "" : "bg-[#f9f9f9]"}`}>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    {c.eleve ? `${c.eleve.prenom} ${c.eleve.nom}` : "Administrateur"}
                  </p>
                  <p className="text-xs text-[#666666]">{c.email}</p>
                  {c.motDePasseTemporaire && (
                    <span className="text-xs text-orange-600 font-medium">⚠ Mot de passe temporaire</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                    {c.role === "ADMIN" ? "Admin" : "Élève"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-sm text-[#666666]">
                  {format(new Date(c.createdAt), "d MMM yyyy", { locale: fr })}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.actif ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.role !== "ADMIN" && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => resetMdp(c.id)} title="Réinitialiser le mot de passe" className="text-[#666666] hover:text-[#cc0000] transition-colors">
                        <RefreshCw size={15} />
                      </button>
                      <button onClick={() => toggleActif(c.id)} title={c.actif ? "Désactiver" : "Activer"} className="text-[#666666] hover:text-[#cc0000] transition-colors">
                        {c.actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
