"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw, ToggleLeft, ToggleRight, Copy, Check, Plus, KeyRound, X, Pencil, ShieldCheck } from "lucide-react";
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
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string })?.id;

  const [comptes, setComptes] = useState<Compte[]>([]);
  const [mdpReset, setMdpReset] = useState<{ id: string; mdp: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", confirm: "" });
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const [showMdpModal, setShowMdpModal] = useState(false);
  const [mdpForm, setMdpForm] = useState({ ancienMdp: "", nouveauMdp: "", confirmer: "" });
  const [mdpError, setMdpError] = useState("");
  const [mdpLoading, setMdpLoading] = useState(false);
  const [mdpOk, setMdpOk] = useState(false);

  const [editEmail, setEditEmail] = useState<{ id: string; value: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    fetch("/api/comptes").then((r) => r.json()).then(setComptes);
  }, []);

  const copier = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const creerAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    if (adminForm.password !== adminForm.confirm) {
      setAdminError("Les mots de passe ne correspondent pas");
      return;
    }
    if (adminForm.password.length < 8) {
      setAdminError("Mot de passe trop court (8 caractères minimum)");
      return;
    }
    setAdminLoading(true);
    const res = await fetch("/api/comptes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminForm.email, password: adminForm.password, role: "ADMIN" }),
    });
    const data = await res.json();
    setAdminLoading(false);
    if (!res.ok) { setAdminError(data.error); return; }
    setShowAdminModal(false);
    setAdminForm({ email: "", password: "", confirm: "" });
    fetch("/api/comptes").then((r) => r.json()).then(setComptes);
  };

  const changerMonMdp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMdpError("");
    if (mdpForm.nouveauMdp !== mdpForm.confirmer) {
      setMdpError("Les mots de passe ne correspondent pas");
      return;
    }
    if (mdpForm.nouveauMdp.length < 8) {
      setMdpError("8 caractères minimum");
      return;
    }
    setMdpLoading(true);
    const res = await fetch(`/api/comptes/${currentUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setPassword", ancienMdp: mdpForm.ancienMdp, nouveauMdp: mdpForm.nouveauMdp }),
    });
    const data = await res.json();
    setMdpLoading(false);
    if (!res.ok) { setMdpError(data.error); return; }
    setMdpOk(true);
    setTimeout(() => { setShowMdpModal(false); setMdpOk(false); setMdpForm({ ancienMdp: "", nouveauMdp: "", confirmer: "" }); }, 1800);
  };

  const sauvegarderEmail = async (id: string) => {
    if (!editEmail) return;
    setEmailLoading(true);
    const res = await fetch(`/api/comptes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "changeEmail", email: editEmail.value }),
    });
    setEmailLoading(false);
    if (res.ok) {
      setComptes((prev) => prev.map((c) => c.id === id ? { ...c, email: editEmail.value } : c));
      setEditEmail(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Gestion des comptes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMdpModal(true)}
            className="flex items-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
          >
            <KeyRound size={15} />
            Mon mot de passe
          </button>
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            <Plus size={15} />
            Compte admin
          </button>
        </div>
      </div>

      {mdpReset && (
        <div className="bg-green-50 border border-green-200 rounded-[12px] p-4 mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-green-800">Mot de passe temporaire généré</p>
            <p className="text-lg font-bold text-green-900 font-mono mt-1">{mdpReset.mdp}</p>
            <p className="text-xs text-green-600 mt-0.5">À communiquer à l&apos;élève — il devra le changer à la prochaine connexion</p>
          </div>
          <button onClick={() => copier(mdpReset.mdp)} className="flex items-center gap-2 bg-green-700 text-white rounded-[8px] px-3 py-2 text-sm flex-shrink-0">
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
            {comptes.map((c, i) => {
              const isSelf = c.id === currentUserId;
              return (
                <tr key={c.id} className={`border-b border-[#e5e5e5] ${i % 2 === 0 ? "" : "bg-[#f9f9f9]"}`}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      {c.eleve ? `${c.eleve.prenom} ${c.eleve.nom}` : "Administrateur"}
                      {isSelf && <span className="ml-1.5 text-[10px] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] px-1.5 py-0.5 rounded-full font-semibold">Vous</span>}
                    </p>
                    {editEmail?.id === c.id ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="email"
                          value={editEmail.value}
                          onChange={(e) => setEditEmail({ id: c.id, value: e.target.value })}
                          className="border border-[#e5e5e5] rounded-[6px] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)] w-44"
                        />
                        <button onClick={() => sauvegarderEmail(c.id)} disabled={emailLoading} className="text-[10px] bg-[var(--color-primary)] text-white rounded-[6px] px-2 py-1">
                          {emailLoading ? "…" : "OK"}
                        </button>
                        <button onClick={() => setEditEmail(null)} className="text-[10px] text-[#666666] hover:text-[#1a1a1a]">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-xs text-[#666666]">{c.email}</p>
                        <button
                          onClick={() => setEditEmail({ id: c.id, value: c.email })}
                          className="text-[#bbbbbb] hover:text-[var(--color-primary)] transition-colors"
                          title="Modifier l'email"
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                    )}
                    {c.motDePasseTemporaire && (
                      <span className="text-[10px] text-orange-600 font-medium">⚠ Mot de passe temporaire</span>
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
                    <div className="flex items-center gap-2">
                      {isSelf ? (
                        <button
                          onClick={() => setShowMdpModal(true)}
                          title="Changer mon mot de passe"
                          className="text-[#666666] hover:text-[var(--color-primary)] transition-colors"
                        >
                          <KeyRound size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => resetMdp(c.id)}
                          title="Réinitialiser le mot de passe"
                          className="text-[#666666] hover:text-[var(--color-primary)] transition-colors"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      {!isSelf && (
                        <button
                          onClick={() => toggleActif(c.id)}
                          title={c.actif ? "Désactiver" : "Activer"}
                          className="text-[#666666] hover:text-[var(--color-primary)] transition-colors"
                        >
                          {c.actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {comptes.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#666666] text-sm py-8">Aucun compte trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdminModal(false)}>
          <div className="bg-white rounded-[12px] p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-600" />
                <h2 className="font-bold text-[#1a1a1a]">Créer un compte admin</h2>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-[#666666] hover:text-[#1a1a1a]"><X size={18} /></button>
            </div>
            <form onSubmit={creerAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
                <p className="text-xs text-[#999999] mt-1">8 caractères minimum</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Confirmer</label>
                <input
                  type="password"
                  required
                  value={adminForm.confirm}
                  onChange={(e) => setAdminForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              {adminError && <p className="text-sm text-red-500">{adminError}</p>}
              <button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
              >
                {adminLoading ? "Création…" : "Créer le compte"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showMdpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMdpModal(false)}>
          <div className="bg-white rounded-[12px] p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-[var(--color-primary)]" />
                <h2 className="font-bold text-[#1a1a1a]">Changer mon mot de passe</h2>
              </div>
              <button onClick={() => setShowMdpModal(false)} className="text-[#666666] hover:text-[#1a1a1a]"><X size={18} /></button>
            </div>

            {mdpOk ? (
              <div className="flex flex-col items-center py-4 gap-2 text-green-700">
                <Check size={32} className="bg-green-100 rounded-full p-1.5" />
                <p className="text-sm font-medium">Mot de passe mis à jour !</p>
              </div>
            ) : (
              <form onSubmit={changerMonMdp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Mot de passe actuel</label>
                  <input
                    type="password"
                    required
                    value={mdpForm.ancienMdp}
                    onChange={(e) => setMdpForm((f) => ({ ...f, ancienMdp: e.target.value }))}
                    className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    required
                    value={mdpForm.nouveauMdp}
                    onChange={(e) => setMdpForm((f) => ({ ...f, nouveauMdp: e.target.value }))}
                    className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  <p className="text-xs text-[#999999] mt-1">8 caractères minimum</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Confirmer</label>
                  <input
                    type="password"
                    required
                    value={mdpForm.confirmer}
                    onChange={(e) => setMdpForm((f) => ({ ...f, confirmer: e.target.value }))}
                    className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                {mdpError && <p className="text-sm text-red-500">{mdpError}</p>}
                <button
                  type="submit"
                  disabled={mdpLoading}
                  className="w-full bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
                >
                  {mdpLoading ? "Enregistrement…" : "Changer le mot de passe"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
