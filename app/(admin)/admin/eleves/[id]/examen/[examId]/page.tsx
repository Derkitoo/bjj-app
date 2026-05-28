"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X, Minus, Save, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CeintureBadge from "@/components/CeintureBadge";

interface Technique {
  id: string;
  nom: string;
  statut: string;
  commentaire: string | null;
  ordre: number;
}

interface Examen {
  id: string;
  ceintureCible: string;
  date: string | null;
  statut: string;
  notesProf: string | null;
  eleve: { id: string; nom: string; prenom: string; ceinture: string; barrettes: number };
  techniques: Technique[];
  createdAt: string;
}

const STATUT_TECH: Record<string, { label: string; icon: typeof Check; color: string; bg: string }> = {
  NON_EVALUE: { label: "Non évalué", icon: Minus,  color: "text-[#999999]",  bg: "bg-[#f5f5f5]" },
  EN_COURS:   { label: "En cours",   icon: Minus,  color: "text-orange-600", bg: "bg-orange-50" },
  MAITRISE:   { label: "Maîtrisé",   icon: Check,  color: "text-green-600",  bg: "bg-green-50" },
  ECHOUE:     { label: "À retravailler", icon: X,  color: "text-red-600",   bg: "bg-red-50" },
};

const CYCLE: Record<string, string> = {
  NON_EVALUE: "EN_COURS",
  EN_COURS:   "MAITRISE",
  MAITRISE:   "ECHOUE",
  ECHOUE:     "NON_EVALUE",
};

const CEINTURE_LABEL: Record<string, string> = {
  BLEUE: "🔵 Bleue", VIOLETTE: "🟣 Violette", MARRON: "🟤 Marron", NOIRE: "⚫ Noire",
};

const EXAM_STATUT: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente",  color: "text-orange-700", bg: "bg-orange-100" },
  REUSSI:     { label: "Réussi ✓",    color: "text-green-700",  bg: "bg-green-100" },
  ECHOUE:     { label: "Échoué",      color: "text-red-700",    bg: "bg-red-100" },
};

export default function ExamenDetailPage() {
  const { id, examId } = useParams<{ id: string; examId: string }>();
  const router = useRouter();

  const [examen, setExamen] = useState<Examen | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notesProf, setNotesProf] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nouvelleTechnique, setNouvelleTechnique] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/examens/${examId}`);
    if (res.ok) {
      const data: Examen = await res.json();
      setExamen(data);
      setNotesProf(data.notesProf ?? "");
    }
    setLoading(false);
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  const cyclerStatutTech = (techId: string) => {
    setExamen((prev) =>
      prev
        ? {
            ...prev,
            techniques: prev.techniques.map((t) =>
              t.id === techId ? { ...t, statut: CYCLE[t.statut] ?? "NON_EVALUE" } : t
            ),
          }
        : prev
    );
  };

  const modifierCommentaire = (techId: string, val: string) => {
    setExamen((prev) =>
      prev
        ? { ...prev, techniques: prev.techniques.map((t) => (t.id === techId ? { ...t, commentaire: val } : t)) }
        : prev
    );
  };

  const ajouterTechnique = async () => {
    const nom = nouvelleTechnique.trim();
    if (!nom || !examen) return;
    const updatedTechniques = [
      ...examen.techniques,
      { id: "", nom, statut: "NON_EVALUE", commentaire: null, ordre: examen.techniques.length },
    ];
    setExamen({ ...examen, techniques: updatedTechniques });
    setNouvelleTechnique("");
  };

  const supprimerTechnique = (techId: string) => {
    setExamen((prev) =>
      prev ? { ...prev, techniques: prev.techniques.filter((t) => t.id !== techId) } : prev
    );
  };

  const changerStatutExamen = async (statut: string) => {
    if (!examen) return;
    setSaving(true);
    const res = await fetch(`/api/examens/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    if (res.ok) {
      const updated: Examen = await res.json();
      setExamen(updated);
    }
    setSaving(false);
  };

  const sauvegarder = async () => {
    if (!examen) return;
    setSaving(true);
    await fetch(`/api/examens/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notesProf,
        techniques: examen.techniques.map((t) => ({
          nom: t.nom,
          statut: t.statut,
          commentaire: t.commentaire,
        })),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const supprimerExamen = async () => {
    await fetch(`/api/examens/${examId}`, { method: "DELETE" });
    router.push(`/admin/eleves/${id}`);
  };

  if (loading) return <div className="text-sm text-[#666666]">Chargement...</div>;
  if (!examen) return <div className="text-sm text-[#666666]">Examen introuvable</div>;

  const sc = EXAM_STATUT[examen.statut] ?? EXAM_STATUT.EN_ATTENTE;
  const nbMaitrises = examen.techniques.filter((t) => t.statut === "MAITRISE").length;
  const total = examen.techniques.length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/eleves/${id}`} className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">
            Examen {CEINTURE_LABEL[examen.ceintureCible] ?? examen.ceintureCible}
          </h1>
          <p className="text-sm text-[#999999] mt-0.5">
            {examen.eleve.prenom} {examen.eleve.nom}
            {examen.date && (
              <> · {format(new Date(examen.date), "d MMMM yyyy", { locale: fr })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sauvegarder}
            disabled={saving}
            className="flex items-center gap-2 bg-[#cc0000] text-white rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#aa0000] disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {saved ? "Sauvegardé ✓" : saving ? "..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Colonne gauche : infos + statut global ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="font-semibold text-[#1a1a1a] mb-4">Élève</h2>
            <CeintureBadge ceinture={examen.eleve.ceinture} barrettes={examen.eleve.barrettes} />
            <p className="text-sm text-[#666666] mt-2">
              Cible : <span className="font-medium text-[#1a1a1a]">{CEINTURE_LABEL[examen.ceintureCible]}</span>
            </p>
          </div>

          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="font-semibold text-[#1a1a1a] mb-3">Progression</h2>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-black text-[#1a1a1a]">{nbMaitrises}</span>
              <span className="text-sm text-[#999999] mb-1">/ {total} maîtrisées</span>
            </div>
            <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${(nbMaitrises / total) * 100}%` : "0%" }}
              />
            </div>
          </div>

          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="font-semibold text-[#1a1a1a] mb-3">Résultat final</h2>
            <div className="space-y-2">
              {Object.entries(EXAM_STATUT).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => changerStatutExamen(k)}
                  disabled={saving}
                  className={`w-full py-2.5 px-4 rounded-[8px] text-sm font-medium border-2 text-left transition-colors ${
                    examen.statut === k
                      ? `border-current ${v.bg} ${v.color}`
                      : "border-[#e5e5e5] text-[#666666] hover:border-[#aaaaaa]"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <h2 className="font-semibold text-[#1a1a1a] mb-3">Notes du professeur</h2>
            <textarea
              value={notesProf}
              onChange={(e) => setNotesProf(e.target.value)}
              rows={4}
              placeholder="Observations générales, points forts, axes d'amélioration…"
              className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000] resize-none placeholder:text-[#aaaaaa]"
            />
          </div>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-sm text-[#aaaaaa] hover:text-[#ef4444] transition-colors px-1"
            >
              <Trash2 size={14} />
              Supprimer l&apos;examen
            </button>
          ) : (
            <div className="bg-red-50 rounded-[12px] p-4 space-y-2">
              <p className="text-sm font-semibold text-red-700">Supprimer cet examen ?</p>
              <p className="text-xs text-red-500">Cette action est irréversible.</p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={supprimerExamen}
                  className="bg-[#ef4444] text-white rounded-[8px] px-3 py-1.5 text-sm font-medium hover:bg-[#dc2626] transition-colors"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-[#666666] hover:text-[#1a1a1a]"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Colonne droite : techniques ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-[#1a1a1a]">Techniques</h2>
              <p className="text-xs text-[#999999]">Appuyez sur le statut pour le faire avancer</p>
            </div>
            <p className="text-xs text-[#aaaaaa] mb-4">
              <span className="inline-flex items-center gap-1 mr-3"><Minus size={11} className="text-[#999999]" /> Non évalué</span>
              <span className="inline-flex items-center gap-1 mr-3"><Minus size={11} className="text-orange-500" /> En cours</span>
              <span className="inline-flex items-center gap-1 mr-3"><Check size={11} className="text-green-500" /> Maîtrisé</span>
              <span className="inline-flex items-center gap-1"><X size={11} className="text-red-500" /> À retravailler</span>
            </p>

            <div className="space-y-2">
              {examen.techniques.map((t) => {
                const sc2 = STATUT_TECH[t.statut] ?? STATUT_TECH.NON_EVALUE;
                const Icon = sc2.icon;
                return (
                  <div key={t.id || t.nom} className={`rounded-[10px] p-3 border ${sc2.bg} border-transparent`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => t.id ? cyclerStatutTech(t.id) : undefined}
                        title="Changer le statut"
                        className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all hover:scale-110 ${sc2.color} border-current`}
                      >
                        <Icon size={14} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a]">{t.nom}</p>
                        <input
                          value={t.commentaire ?? ""}
                          onChange={(e) => t.id && modifierCommentaire(t.id, e.target.value)}
                          placeholder="Commentaire (facultatif)"
                          className="mt-1 w-full text-xs bg-transparent border-b border-dashed border-[#cccccc] focus:outline-none focus:border-[#cc0000] text-[#666666] placeholder:text-[#cccccc] py-0.5"
                        />
                      </div>
                      <button
                        onClick={() => t.id ? supprimerTechnique(t.id) : setExamen((prev) => prev ? { ...prev, techniques: prev.techniques.filter((x) => x.nom !== t.nom) } : prev)}
                        className="text-[#cccccc] hover:text-[#ef4444] transition-colors flex-shrink-0 mt-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {examen.techniques.length === 0 && (
                <p className="text-sm text-[#999999] text-center py-4">Aucune technique ajoutée</p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#f5f5f5]">
              <input
                value={nouvelleTechnique}
                onChange={(e) => setNouvelleTechnique(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), ajouterTechnique())}
                placeholder="Ajouter une technique…"
                className="flex-1 border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000] placeholder:text-[#aaaaaa]"
              />
              <button
                onClick={ajouterTechnique}
                disabled={!nouvelleTechnique.trim()}
                className="flex items-center gap-1 bg-[#cc0000] text-white rounded-[8px] px-3 py-2 text-sm font-medium hover:bg-[#aa0000] disabled:opacity-40 transition-colors"
              >
                <Plus size={14} />
                Ajouter
              </button>
            </div>
          </div>

          <div className={`rounded-[12px] p-4 ${sc.bg}`}>
            <p className={`text-sm font-semibold ${sc.color}`}>
              Statut de l&apos;examen : {sc.label}
            </p>
            <p className="text-xs text-[#666666] mt-0.5">
              N&apos;oubliez pas de sauvegarder avant de quitter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
