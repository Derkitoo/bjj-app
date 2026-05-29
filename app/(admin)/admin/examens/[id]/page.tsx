"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, RotateCcw, TrendingUp, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const BELT_LABELS: Record<string, string> = {
  BLANCHE: "Blanche", BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire",
};
const SECTION_LABELS: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Enfants" };

type StatutEval = "NON_EVALUE" | "VALIDE" | "A_RETRAVAILLER";
type ResultatParticipant = "REUSSI" | "EN_PROGRESSION" | null;

interface Evaluation { id: string; critereId: string; statut: StatutEval }
interface Participant {
  id: string;
  resultat: ResultatParticipant;
  notesProf: string | null;
  eleve: { id: string; nom: string; prenom: string; ceinture: string };
  evaluations: Evaluation[];
}
interface Critere { id: string; nom: string; ordre: number }
interface Session {
  id: string;
  date: string;
  ceintureCible: string;
  section: string;
  statut: string;
  notes: string | null;
  criteres: Critere[];
  participants: Participant[];
}

const EVAL_CYCLE: StatutEval[] = ["NON_EVALUE", "VALIDE", "A_RETRAVAILLER"];
const EVAL_CONFIG: Record<StatutEval, { label: string; color: string; icon: string }> = {
  NON_EVALUE:      { label: "—",             color: "bg-[#f0f0f0] text-[#aaaaaa]",      icon: "—" },
  VALIDE:          { label: "Validé",         color: "bg-green-100 text-green-700",       icon: "✓" },
  A_RETRAVAILLER:  { label: "À retravailler", color: "bg-orange-100 text-orange-600",     icon: "↗" },
};

export default function EvaluationExamenPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [evals, setEvals] = useState<Record<string, Record<string, StatutEval>>>({});
  const [resultats, setResultats] = useState<Record<string, ResultatParticipant>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

  const charger = useCallback(async () => {
    const res = await fetch(`/api/examens/${id}`);
    const data: Session = await res.json();
    setSession(data);
    setActiveTab(data.participants[0]?.id ?? "");

    const evMap: Record<string, Record<string, StatutEval>> = {};
    const resMap: Record<string, ResultatParticipant> = {};
    const notesMap: Record<string, string> = {};
    for (const p of data.participants) {
      evMap[p.id] = {};
      for (const ev of p.evaluations) evMap[p.id][ev.critereId] = ev.statut;
      resMap[p.id] = p.resultat;
      notesMap[p.id] = p.notesProf ?? "";
    }
    setEvals(evMap);
    setResultats(resMap);
    setNotes(notesMap);
  }, [id]);

  useEffect(() => { charger(); }, [charger]);

  const cycleEval = (participantId: string, critereId: string) => {
    setEvals((prev) => {
      const cur: StatutEval = prev[participantId]?.[critereId] ?? "NON_EVALUE";
      const next = EVAL_CYCLE[(EVAL_CYCLE.indexOf(cur) + 1) % EVAL_CYCLE.length];
      return { ...prev, [participantId]: { ...prev[participantId], [critereId]: next } };
    });
  };

  const setResultat = (participantId: string, r: ResultatParticipant) => {
    setResultats((prev) => ({ ...prev, [participantId]: prev[participantId] === r ? null : r }));
  };

  const sauvegarder = async (terminer = false) => {
    if (!session) return;
    setSaving(true);
    const evaluations = session.participants.flatMap((p) =>
      session.criteres.map((c) => ({
        participantId: p.id,
        critereId: c.id,
        statut: evals[p.id]?.[c.id] ?? "NON_EVALUE",
      }))
    );
    const resultatsArr = session.participants.map((p) => ({
      participantId: p.id,
      resultat: resultats[p.id] ?? null,
      notesProf: notes[p.id] ?? null,
    }));

    await fetch(`/api/examens/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "evaluer",
        evaluations,
        resultats: resultatsArr,
      }),
    });

    if (terminer) {
      await fetch(`/api/examens/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "statut", statut: "TERMINE" }),
      });
      await charger();
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!session) return <div className="text-sm text-[#666666]">Chargement…</div>;

  const activeParticipant = session.participants.find((p) => p.id === activeTab);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Link href="/admin/examens" className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#1a1a1a]">
            Examen — Ceinture {BELT_LABELS[session.ceintureCible] ?? session.ceintureCible}
            <span className="text-sm font-normal text-[#999999] ml-2">{SECTION_LABELS[session.section]}</span>
          </h1>
          <p className="text-xs text-[#999999] mt-0.5">{format(new Date(session.date), "EEEE d MMMM yyyy", { locale: fr })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => sauvegarder(false)} disabled={saving}
            className="flex items-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-3 py-2 text-sm font-medium hover:bg-[#f9f9f9] disabled:opacity-50 transition-colors">
            <Save size={14} />
            {saved ? "Enregistré ✓" : saving ? "…" : "Sauvegarder"}
          </button>
          {session.statut !== "TERMINE" && (
            <button onClick={() => sauvegarder(true)} disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white rounded-[8px] px-3 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              <CheckCircle size={14} />
              Clôturer
            </button>
          )}
        </div>
      </div>

      {session.statut === "TERMINE" && (
        <div className="bg-green-50 border border-green-200 rounded-[12px] px-4 py-3 mb-4 flex items-center gap-2 text-sm text-green-800">
          <CheckCircle size={15} />
          Examen clôturé — résultats visibles par les élèves
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">

        {/* Onglets participants */}
        <div className="bg-white rounded-[16px] shadow-sm p-3">
          <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide px-2 mb-2">Participants</p>
          <div className="space-y-1">
            {session.participants.map((p) => {
              const nb = session.criteres.length;
              const valides = Object.values(evals[p.id] ?? {}).filter((s) => s === "VALIDE").length;
              const res = resultats[p.id];
              return (
                <button key={p.id} onClick={() => setActiveTab(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                    activeTab === p.id ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]" : "hover:bg-[#f9f9f9] text-[#1a1a1a]"
                  }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.eleve.prenom} {p.eleve.nom}</p>
                    <p className="text-[10px] text-[#aaaaaa]">{valides}/{nb} validés</p>
                  </div>
                  {res === "REUSSI" && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">✓</span>}
                  {res === "EN_PROGRESSION" && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">↗</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone évaluation */}
        {activeParticipant && (
          <div className="space-y-4">
            <div className="bg-white rounded-[16px] shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-[#1a1a1a]">
                  {activeParticipant.eleve.prenom} {activeParticipant.eleve.nom}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#999999]">Résultat :</span>
                  <button
                    onClick={() => setResultat(activeParticipant.id, "REUSSI")}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[8px] border-2 transition-colors ${
                      resultats[activeParticipant.id] === "REUSSI"
                        ? "bg-green-100 border-green-400 text-green-800"
                        : "border-[#e5e5e5] text-[#666666] hover:border-green-300"
                    }`}>
                    <CheckCircle size={13} /> Réussi
                  </button>
                  <button
                    onClick={() => setResultat(activeParticipant.id, "EN_PROGRESSION")}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[8px] border-2 transition-colors ${
                      resultats[activeParticipant.id] === "EN_PROGRESSION"
                        ? "bg-orange-100 border-orange-400 text-orange-700"
                        : "border-[#e5e5e5] text-[#666666] hover:border-orange-300"
                    }`}>
                    <TrendingUp size={13} /> En progression
                  </button>
                  {resultats[activeParticipant.id] && (
                    <button onClick={() => setResultat(activeParticipant.id, null)}
                      className="text-[#cccccc] hover:text-[#666666] transition-colors">
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Critères */}
              <div className="space-y-2">
                {session.criteres.map((c) => {
                  const statut: StatutEval = evals[activeParticipant.id]?.[c.id] ?? "NON_EVALUE";
                  const cfg = EVAL_CONFIG[statut];
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-2 border-b border-[#f5f5f5] last:border-0">
                      <span className="flex-1 text-sm text-[#1a1a1a]">{c.nom}</span>
                      <button
                        onClick={() => cycleEval(activeParticipant.id, c.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[8px] min-w-[130px] justify-center transition-colors ${cfg.color}`}>
                        <span>{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-[#666666] mb-1">Notes du professeur</label>
                <textarea
                  value={notes[activeParticipant.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [activeParticipant.id]: e.target.value }))}
                  rows={2}
                  placeholder="Observations, encouragements…"
                  className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none placeholder:text-[#aaaaaa]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
