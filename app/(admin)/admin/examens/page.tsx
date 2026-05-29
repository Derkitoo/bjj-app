"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ChevronRight, Award, Users, CheckCircle, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const BELT_COLORS: Record<string, string> = {
  BLANCHE: "#d1d5db", BLEUE: "#3b82f6", VIOLETTE: "#8b5cf6", MARRON: "#92400e", NOIRE: "#1a1a1a",
};
const BELT_LABELS: Record<string, string> = {
  BLANCHE: "Blanche", BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire",
};
const SECTION_LABELS: Record<string, string> = {
  GI: "Gi", NO_GI: "No-Gi", KIDS: "Enfants",
};
const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  PLANIFIE:  { label: "Planifié",   color: "bg-blue-100 text-blue-700" },
  EN_COURS:  { label: "En cours",   color: "bg-orange-100 text-orange-700" },
  TERMINE:   { label: "Terminé",    color: "bg-green-100 text-green-700" },
};

interface ExamenSession {
  id: string;
  date: string;
  ceintureCible: string;
  section: string;
  statut: string;
  notes: string | null;
  criteres: { id: string; nom: string }[];
  participants: {
    id: string;
    resultat: string | null;
    eleve: { id: string; nom: string; prenom: string };
  }[];
}

export default function ExamensPage() {
  const [sessions, setSessions] = useState<ExamenSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const charger = () =>
    fetch("/api/examens").then((r) => r.json()).then((data) => { setSessions(data); setLoading(false); });

  useEffect(() => { charger(); }, []);

  const supprimer = async (id: string) => {
    await fetch(`/api/examens/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setConfirmDel(null);
  };

  if (loading) return <div className="text-sm text-[#666666]">Chargement…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Examens</h1>
        <Link
          href="/admin/examens/nouveau"
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <Plus size={15} />
          Créer un examen
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-[16px] shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <Award size={24} className="text-[#cccccc]" />
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">Aucun examen créé</p>
          <p className="text-xs text-[#999999] mt-1">Crée ta première session d&apos;examen collectif</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const reussis = s.participants.filter((p) => p.resultat === "REUSSI").length;
            const enProg = s.participants.filter((p) => p.resultat === "EN_PROGRESSION").length;
            const statut = STATUT_CONFIG[s.statut] ?? STATUT_CONFIG.PLANIFIE;
            return (
              <div key={s.id} className="bg-white rounded-[16px] shadow-sm overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: BELT_COLORS[s.ceintureCible] + "22" }}
                  >
                    <Award size={18} style={{ color: BELT_COLORS[s.ceintureCible] }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#1a1a1a] text-sm">
                        Ceinture {BELT_LABELS[s.ceintureCible] ?? s.ceintureCible}
                      </p>
                      <span className="text-xs text-[#999999]">· {SECTION_LABELS[s.section] ?? s.section}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statut.color}`}>
                        {statut.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#999999]">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {format(new Date(s.date), "d MMM yyyy", { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {s.participants.length} élève{s.participants.length > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={11} />
                        {s.criteres.length} critère{s.criteres.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    {s.statut === "TERMINE" && s.participants.length > 0 && (
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-green-700 font-medium">✓ {reussis} réussi{reussis > 1 ? "s" : ""}</span>
                        {enProg > 0 && <span className="text-orange-600 font-medium">↗ {enProg} en progression</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {confirmDel === s.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => supprimer(s.id)} className="text-xs bg-red-500 text-white rounded-[6px] px-2 py-1">Confirmer</button>
                        <button onClick={() => setConfirmDel(null)} className="text-xs text-[#666666]">Annuler</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDel(s.id)} className="text-[#cccccc] hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                    <Link href={`/admin/examens/${s.id}`} className="text-[#666666] hover:text-[#1a1a1a] transition-colors">
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
