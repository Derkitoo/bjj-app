"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  RefreshCw, ToggleLeft, ToggleRight, Copy, Check, Plus,
  KeyRound, X, Pencil, ShieldCheck, GraduationCap, Users, Settings,
  LayoutDashboard, CheckSquare, Calendar, Award, Newspaper, CreditCard, UserCog,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Compte {
  id: string;
  email: string;
  role: string;
  actif: boolean;
  permissions: string;
  motDePasseTemporaire: boolean;
  createdAt: string;
  eleve: { nom: string; prenom: string; ceinture: string } | null;
}

type FiltreRole = "TOUS" | "ADMIN" | "PROF" | "ELEVE";
type NouveauRole = "ADMIN" | "PROF";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  PROF:  "bg-orange-100 text-orange-700",
  ELEVE: "bg-blue-100 text-blue-800",
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  PROF:  "Professeur",
  ELEVE: "Élève",
};

const SECTIONS = [
  { key: "dashboard",  label: "Tableau de bord", icon: LayoutDashboard },
  { key: "eleves",     label: "Élèves",           icon: Users },
  { key: "presence",   label: "Présence",         icon: CheckSquare },
  { key: "planning",   label: "Planning",         icon: Calendar },
  { key: "ceintures",  label: "Ceintures",        icon: Award },
  { key: "actualites", label: "Actualités",       icon: Newspaper },
  { key: "paiements",  label: "Paiements",        icon: CreditCard },
  { key: "comptes",    label: "Comptes",          icon: UserCog },
];

const parsePermissions = (raw: string): string[] => {
  try { return JSON.parse(raw); } catch { return []; }
};

export default function ComptesPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string })?.id;

  const [comptes, setComptes] = useState<Compte[]>([]);
  const [filtre, setFiltre] = useState<FiltreRole>("TOUS");
  const [mdpReset, setMdpReset] = useState<{ id: string; mdp: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [nouveauRole, setNouveauRole] = useState<NouveauRole>("PROF");
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [showMdpModal, setShowMdpModal] = useState(false);
  const [mdpForm, setMdpForm] = useState({ ancienMdp: "", nouveauMdp: "", confirmer: "" });
  const [mdpError, setMdpError] = useState("");
  const [mdpLoading, setMdpLoading] = useState(false);
  const [mdpOk, setMdpOk] = useState(false);

  const [editEmail, setEditEmail] = useState<{ id: string; value: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

  const [permPanel, setPermPanel] = useState<string | null>(null);
  const [permState, setPermState] = useState<Record<string, string[]>>({});
  const [permLoading, setPermLoading] = useState(false);

  const charger = () =>
    fetch("/api/comptes").then((r) => r.json()).then((data: Compte[]) => {
      setComptes(data);
      const initial: Record<string, string[]> = {};
      data.forEach((c) => { initial[c.id] = parsePermissions(c.permissions); });
      setPermState(initial);
    });

  useEffect(() => { charger(); }, []);

  const comptesFiltres = filtre === "TOUS" ? comptes : comptes.filter((c) => c.role === filtre);

  const stats = {
    admins: comptes.filter((c) => c.role === "ADMIN").length,
    profs:  comptes.filter((c) => c.role === "PROF").length,
    eleves: comptes.filter((c) => c.role === "ELEVE").length,
    actifs: comptes.filter((c) => c.actif).length,
  };

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

  const changerRole = async (id: string, role: string) => {
    setRoleLoading(id);
    const res = await fetch(`/api/comptes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "changeRole", role }),
    });
    setRoleLoading(null);
    if (res.ok) {
      setComptes((prev) => prev.map((c) => c.id === id ? { ...c, role } : c));
    }
  };

  const togglePermission = (id: string, section: string) => {
    setPermState((prev) => {
      const current = prev[id] ?? [];
      const next = current.includes(section)
        ? current.filter((s) => s !== section)
        : [...current, section];
      return { ...prev, [id]: next };
    });
  };

  const sauvegarderPermissions = async (id: string) => {
    setPermLoading(true);
    await fetch(`/api/comptes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "changePermissions", permissions: permState[id] ?? [] }),
    });
    setPermLoading(false);
    setPermPanel(null);
  };

  const creerCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (form.password !== form.confirm) {
      setFormError("Les mots de passe ne correspondent pas");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Mot de passe trop court (8 caractères minimum)");
      return;
    }
    setFormLoading(true);
    const res = await fetch("/api/comptes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, password: form.password, role: nouveauRole }),
    });
    const data = await res.json();
    setFormLoading(false);
    if (!res.ok) { setFormError(data.error); return; }
    setShowModal(false);
    setForm({ email: "", password: "", confirm: "" });
    charger();
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
    setTimeout(() => {
      setShowMdpModal(false);
      setMdpOk(false);
      setMdpForm({ ancienMdp: "", nouveauMdp: "", confirmer: "" });
    }, 1800);
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
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Comptes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMdpModal(true)}
            className="flex items-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
          >
            <KeyRound size={15} />
            Mon mot de passe
          </button>
          <button
            onClick={() => { setNouveauRole("PROF"); setShowModal(true); }}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            <Plus size={15} />
            Nouveau compte
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-[12px] shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={16} className="text-purple-700" />
          </div>
          <div>
            <p className="text-xl font-black text-[#1a1a1a]">{stats.admins}</p>
            <p className="text-xs text-[#999999]">Admins</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={16} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xl font-black text-[#1a1a1a]">{stats.profs}</p>
            <p className="text-xs text-[#999999]">Professeurs</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Users size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-black text-[#1a1a1a]">{stats.eleves}</p>
            <p className="text-xs text-[#999999]">Élèves</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-xl font-black text-[#1a1a1a]">{stats.actifs}</p>
            <p className="text-xs text-[#999999]">Actifs</p>
          </div>
        </div>
      </div>

      {mdpReset && (
        <div className="bg-green-50 border border-green-200 rounded-[12px] p-4 mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-green-800">Mot de passe temporaire généré</p>
            <p className="text-lg font-bold text-green-900 font-mono mt-1">{mdpReset.mdp}</p>
            <p className="text-xs text-green-600 mt-0.5">À communiquer à l&apos;utilisateur — il devra le changer à la prochaine connexion</p>
          </div>
          <button onClick={() => copier(mdpReset.mdp)} className="flex items-center gap-2 bg-green-700 text-white rounded-[8px] px-3 py-2 text-sm flex-shrink-0">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      )}

      {/* Filtre par rôle */}
      <div className="flex items-center gap-2 mb-4">
        {(["TOUS", "ADMIN", "PROF", "ELEVE"] as FiltreRole[]).map((r) => (
          <button
            key={r}
            onClick={() => setFiltre(r)}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
              filtre === r
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[#e5e5e5] text-[#666666] hover:bg-[#f9f9f9]"
            }`}
          >
            {r === "TOUS" ? "Tous" : ROLE_LABEL[r]}
            <span className="ml-1.5 opacity-60">
              {r === "TOUS" ? comptes.length : comptes.filter((c) => c.role === r).length}
            </span>
          </button>
        ))}
      </div>

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
            {comptesFiltres.map((c, i) => {
              const isSelf = c.id === currentUserId;
              const perms = permState[c.id] ?? [];
              const isPanelOpen = permPanel === c.id;
              return (
                <>
                  <tr key={c.id} className={`border-b border-[#e5e5e5] ${isPanelOpen ? "bg-[#fafafa]" : i % 2 === 0 ? "" : "bg-[#f9f9f9]"}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {c.eleve ? `${c.eleve.prenom} ${c.eleve.nom}` : c.role === "PROF" ? "Professeur" : "Administrateur"}
                        {isSelf && (
                          <span className="ml-1.5 text-[10px] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] px-1.5 py-0.5 rounded-full font-semibold">
                            Vous
                          </span>
                        )}
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
                      {isSelf ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[c.role] ?? "bg-gray-100 text-gray-600"}`}>
                          {ROLE_LABEL[c.role] ?? c.role}
                        </span>
                      ) : (
                        <select
                          value={c.role}
                          disabled={roleLoading === c.id}
                          onChange={(e) => changerRole(c.id, e.target.value)}
                          className={`text-xs rounded-[6px] px-2 py-0.5 font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] ${ROLE_BADGE[c.role] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="PROF">Professeur</option>
                          <option value="ELEVE">Élève</option>
                        </select>
                      )}
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
                        {!isSelf && c.role !== "ELEVE" && (
                          <button
                            onClick={() => setPermPanel(isPanelOpen ? null : c.id)}
                            title="Gérer les accès"
                            className={`transition-colors ${isPanelOpen ? "text-[var(--color-primary)]" : "text-[#666666] hover:text-[var(--color-primary)]"}`}
                          >
                            <Settings size={15} />
                          </button>
                        )}
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

                  {/* Panneau permissions */}
                  {isPanelOpen && c.role !== "ADMIN" && (
                    <tr key={`${c.id}-perm`} className="border-b border-[#e5e5e5] bg-[#fafafa]">
                      <td colSpan={5} className="px-4 pb-4 pt-0">
                        <div className="border border-[#e5e5e5] rounded-[10px] p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-[#666666] uppercase tracking-wide">Sections autorisées</p>
                            {c.role === "ADMIN" && (
                              <span className="text-xs text-purple-600 font-medium">Admin — accès total automatique</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {SECTIONS.map(({ key, label, icon: Icon }) => {
                              const checked = perms.includes(key);
                              return (
                                <label
                                  key={key}
                                  className={`flex items-center gap-2 rounded-[8px] px-3 py-2 cursor-pointer border transition-colors ${
                                    checked
                                      ? "bg-[var(--color-primary-subtle)] border-[var(--color-primary)] text-[var(--color-primary)]"
                                      : "border-[#e5e5e5] text-[#666666] hover:bg-[#f9f9f9]"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={checked}
                                    onChange={() => togglePermission(c.id, key)}
                                  />
                                  <Icon size={14} />
                                  <span className="text-xs font-medium">{label}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => sauvegarderPermissions(c.id)}
                              disabled={permLoading}
                              className="bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2 text-xs font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
                            >
                              {permLoading ? "Enregistrement…" : "Enregistrer les accès"}
                            </button>
                            <button
                              onClick={() => setPermPanel(null)}
                              className="text-xs text-[#666666] hover:text-[#1a1a1a] px-3 py-2"
                            >
                              Annuler
                            </button>
                            <span className="text-xs text-[#999999] ml-auto">
                              {perms.length === 0 ? "Aucun accès" : `${perms.length} section${perms.length > 1 ? "s" : ""}`}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {comptesFiltres.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#666666] text-sm py-8">Aucun compte trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal création compte */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[12px] p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#1a1a1a]">Nouveau compte</h2>
              <button onClick={() => setShowModal(false)} className="text-[#666666] hover:text-[#1a1a1a]"><X size={18} /></button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setNouveauRole("PROF")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-[8px] px-3 py-2.5 text-sm font-medium border transition-colors ${
                  nouveauRole === "PROF"
                    ? "bg-orange-50 border-orange-300 text-orange-700"
                    : "border-[#e5e5e5] text-[#666666] hover:bg-[#f9f9f9]"
                }`}
              >
                <GraduationCap size={15} />
                Professeur
              </button>
              <button
                type="button"
                onClick={() => setNouveauRole("ADMIN")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-[8px] px-3 py-2.5 text-sm font-medium border transition-colors ${
                  nouveauRole === "ADMIN"
                    ? "bg-purple-50 border-purple-300 text-purple-700"
                    : "border-[#e5e5e5] text-[#666666] hover:bg-[#f9f9f9]"
                }`}
              >
                <ShieldCheck size={15} />
                Admin
              </button>
            </div>

            <p className="text-xs text-[#999999] mb-4">
              {nouveauRole === "PROF"
                ? "Définissez les accès via l'icône ⚙ après création"
                : "Accès complet à toutes les sections"}
            </p>

            <form onSubmit={creerCompte} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
                <p className="text-xs text-[#999999] mt-1">8 caractères minimum</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Confirmer</label>
                <input
                  type="password"
                  required
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
              >
                {formLoading ? "Création…" : `Créer le compte ${nouveauRole === "PROF" ? "professeur" : "admin"}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal mot de passe */}
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
