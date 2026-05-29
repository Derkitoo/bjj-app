"use client";

import { useState } from "react";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";

export interface EleveFormData {
  nom: string; prenom: string; email: string; telephone: string;
  dateNaissance: string; categorie: string;
  ceinture: string; barrettes: number; niveauSport: string; objectifs: string;
  poids: string; taille: string; adresse: string; ville: string; codePostal: string;
  contactUrgence: string; telUrgence: string; medical: string;
  typeAbonnement: string; montantMensuel: string; nomFamille: string; notes: string;
  actif: boolean;
}

export const defaultEleveForm: EleveFormData = {
  nom: "", prenom: "", email: "", telephone: "", dateNaissance: "", categorie: "ADULTES",
  ceinture: "BLANCHE", barrettes: 0, niveauSport: "", objectifs: "",
  poids: "", taille: "", adresse: "", ville: "", codePostal: "",
  contactUrgence: "", telUrgence: "", medical: "",
  typeAbonnement: "MENSUEL", montantMensuel: "", nomFamille: "", notes: "", actif: true,
};

const STEPS = [
  { label: "Identité",    short: "Identité" },
  { label: "BJJ",         short: "BJJ" },
  { label: "Pratique",    short: "Pratique" },
  { label: "Abonnement",  short: "Abonnement" },
];

const inputClass = "w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]";
const labelClass = "block text-sm font-medium text-[#1a1a1a] mb-1";

interface Props {
  initialForm?: Partial<EleveFormData>;
  onSubmit: (form: EleveFormData) => Promise<void>;
  loading: boolean;
  error: string;
  submitLabel: string;
}

export default function EleveWizard({ initialForm = {}, onSubmit, loading, error, submitLabel }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EleveFormData>({ ...defaultEleveForm, ...initialForm });

  const set = (field: keyof EleveFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const canNext = () => {
    if (step === 0) return form.prenom.trim() !== "" && form.nom.trim() !== "";
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    await onSubmit(form);
  };

  return (
    <div className="max-w-xl">
      {/* Barre de progression */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { if (i < step || (i === step + 1 && canNext())) setStep(i); }}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step
                  ? "bg-[var(--color-primary)] text-white"
                  : i === step
                  ? "bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary-subtle)]"
                  : "bg-[#f0f0f0] text-[#aaaaaa]"
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${i === step ? "text-[var(--color-primary)]" : i < step ? "text-[#666666]" : "text-[#cccccc]"}`}>
                {s.short}
              </span>
            </button>
          ))}
        </div>
        <div className="relative h-1 bg-[#f0f0f0] rounded-full mx-4">
          <div
            className="absolute h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[16px] shadow-sm p-6">
          <h2 className="font-bold text-[#1a1a1a] text-lg mb-1">{STEPS[step].label}</h2>
          <p className="text-xs text-[#999999] mb-5">Étape {step + 1} sur {STEPS.length}</p>

          {/* ── Étape 1 : Identité ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Prénom <span className="text-[var(--color-primary)]">*</span></label>
                  <input required autoFocus value={form.prenom} onChange={set("prenom")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nom <span className="text-[var(--color-primary)]">*</span></label>
                  <input required value={form.nom} onChange={set("nom")} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} onChange={set("email")}
                  placeholder="Un compte sera créé automatiquement"
                  className={inputClass + " placeholder:text-[#aaaaaa]"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Téléphone</label>
                  <input value={form.telephone} onChange={set("telephone")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Date de naissance</label>
                  <input type="date" value={form.dateNaissance} onChange={set("dateNaissance")} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Catégorie</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "ADULTES", label: "🥋 Adultes", sub: "14 ans et +" },
                    { v: "KIDS",    label: "⭐ Enfants",  sub: "8 à 13 ans" },
                  ].map(({ v, label, sub }) => (
                    <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, categorie: v }))}
                      className={`py-2.5 px-3 rounded-[8px] border-2 text-left transition-colors ${
                        form.categorie === v
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                          : "border-[#e5e5e5] hover:border-[#cccccc]"
                      }`}>
                      <p className={`text-sm font-semibold ${form.categorie === v ? "text-[var(--color-primary)]" : "text-[#1a1a1a]"}`}>{label}</p>
                      <p className="text-[10px] text-[#999999]">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Étape 2 : BJJ ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Ceinture</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {[
                    { v: "BLANCHE",  label: "⬜ Blanche" },
                    { v: "BLEUE",    label: "🔵 Bleue" },
                    { v: "VIOLETTE", label: "🟣 Violette" },
                    { v: "MARRON",   label: "🟤 Marron" },
                    { v: "NOIRE",    label: "⚫ Noire" },
                  ].map(({ v, label }) => (
                    <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, ceinture: v }))}
                      className={`py-2 px-2 rounded-[8px] border-2 text-center text-xs font-medium transition-colors ${
                        form.ceinture === v
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                          : "border-[#e5e5e5] text-[#666666] hover:border-[#cccccc]"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Barrettes</label>
                <div className="flex items-center gap-4">
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, barrettes: Math.max(0, f.barrettes - 1) }))}
                    className="w-9 h-9 rounded-full border border-[#e5e5e5] text-lg font-bold text-[#666666] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center">−</button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className={`w-4 h-6 rounded-sm transition-colors ${i < form.barrettes ? "bg-[var(--color-primary)]" : "bg-[#e5e5e5]"}`} />
                    ))}
                  </div>
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, barrettes: Math.min(4, f.barrettes + 1) }))}
                    className="w-9 h-9 rounded-full border border-[#e5e5e5] text-lg font-bold text-[#666666] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center">+</button>
                  <span className="text-sm text-[#666666]">{form.barrettes}/4</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>Niveau sportif</label>
                <select value={form.niveauSport} onChange={set("niveauSport")} className={inputClass}>
                  <option value="">— Non renseigné —</option>
                  <option value="DEBUTANT">Débutant</option>
                  <option value="INTERMEDIAIRE">Intermédiaire</option>
                  <option value="AVANCE">Avancé</option>
                  <option value="COMPETITEUR">Compétiteur</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Objectifs</label>
                <textarea value={form.objectifs} onChange={set("objectifs")} rows={3}
                  placeholder="Compétition, self-défense, remise en forme…"
                  className={inputClass + " resize-none placeholder:text-[#aaaaaa]"} />
              </div>
              {"actif" in initialForm && (
                <div>
                  <label className={labelClass}>Statut</label>
                  <select
                    value={form.actif ? "actif" : "inactif"}
                    onChange={(e) => setForm((f) => ({ ...f, actif: e.target.value === "actif" }))}
                    className={inputClass}
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ── Étape 3 : Pratique ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Poids (kg)</label>
                  <input type="number" step="0.1" value={form.poids} onChange={set("poids")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Taille (cm)</label>
                  <input type="number" step="1" value={form.taille} onChange={set("taille")} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Adresse</label>
                <input value={form.adresse} onChange={set("adresse")} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ville</label>
                  <input value={form.ville} onChange={set("ville")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Code postal</label>
                  <input value={form.codePostal} onChange={set("codePostal")} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contact d&apos;urgence</label>
                  <input value={form.contactUrgence} onChange={set("contactUrgence")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tél. urgence</label>
                  <input value={form.telUrgence} onChange={set("telUrgence")} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Informations médicales</label>
                <textarea value={form.medical} onChange={set("medical")} rows={2}
                  placeholder="Allergies, blessures, contre-indications…"
                  className={inputClass + " resize-none placeholder:text-[#aaaaaa]"} />
              </div>
            </div>
          )}

          {/* ── Étape 4 : Abonnement ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Type d&apos;abonnement</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "MENSUEL", label: "Mensuel" },
                    { v: "ANNUEL",  label: "Annuel" },
                  ].map(({ v, label }) => (
                    <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, typeAbonnement: v }))}
                      className={`py-2.5 rounded-[8px] border-2 text-sm font-medium transition-colors ${
                        form.typeAbonnement === v
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                          : "border-[#e5e5e5] text-[#666666] hover:border-[#cccccc]"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Tarif personnalisé (€/mois)</label>
                <input type="number" step="0.01" min="0" value={form.montantMensuel} onChange={set("montantMensuel")}
                  placeholder="Laisser vide pour le tarif standard"
                  className={inputClass + " placeholder:text-[#aaaaaa]"} />
              </div>
              <div>
                <label className={labelClass}>Nom de famille</label>
                <input value={form.nomFamille} onChange={set("nomFamille")}
                  placeholder="Ex : Martin (réduction famille)"
                  className={inputClass + " placeholder:text-[#aaaaaa]"} />
                <p className="text-xs text-[#aaaaaa] mt-1">Les membres d&apos;une même famille bénéficient d&apos;une réduction automatique</p>
              </div>
              <div>
                <label className={labelClass}>Notes internes</label>
                <textarea value={form.notes} onChange={set("notes")} rows={3}
                  placeholder="Informations complémentaires visibles uniquement par l'admin…"
                  className={inputClass + " resize-none placeholder:text-[#aaaaaa]"} />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-[#ef4444] text-sm mt-3">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5 pb-6">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] disabled:opacity-0 transition-colors"
          >
            <ChevronLeft size={16} />
            Précédent
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i === step ? "w-5 h-2 bg-[var(--color-primary)]" : i < step ? "w-2 h-2 bg-[var(--color-primary)]" : "w-2 h-2 bg-[#e5e5e5]"
              }`} />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !canNext()}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
          >
            {step < STEPS.length - 1 ? (
              <>Suivant <ChevronRight size={15} /></>
            ) : (
              loading ? "Enregistrement…" : submitLabel
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
