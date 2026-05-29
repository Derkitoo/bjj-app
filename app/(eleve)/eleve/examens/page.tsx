import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ClipboardList, Award } from "lucide-react";

const BELT_LABELS: Record<string, string> = {
  BLANCHE: "Blanche", BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire",
};
const SECTION_LABELS: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Enfants" };

const RESULTAT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  REUSSI:          { label: "Réussi ✓",        color: "text-green-800",  bg: "bg-green-100" },
  EN_PROGRESSION:  { label: "En progression ↗", color: "text-orange-700", bg: "bg-orange-100" },
};
const EVAL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  VALIDE:          { label: "Validé",         color: "text-green-700",  icon: "✓" },
  A_RETRAVAILLER:  { label: "À retravailler", color: "text-orange-600", icon: "↗" },
  NON_EVALUE:      { label: "Non évalué",     color: "text-[#aaaaaa]",  icon: "—" },
};

export default async function MesExamensPage() {
  const session = await auth();
  const eleveId = (session?.user as { eleveId?: string })?.eleveId;
  if (!session || !eleveId) redirect("/login");

  const participations = await prisma.examenParticipant.findMany({
    where: { eleveId },
    include: {
      session: { include: { criteres: { orderBy: { ordre: "asc" } } } },
      evaluations: { include: { critere: true } },
    },
    orderBy: { session: { date: "desc" } },
  });

  const publiees = participations.filter((p) => p.session.statut === "TERMINE");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
        <ClipboardList size={22} className="text-[#cc0000]" />
        Mes examens
      </h1>

      {publiees.length === 0 ? (
        <div className="bg-white rounded-[12px] shadow-sm p-12 text-center">
          <Award size={40} className="mx-auto mb-3 text-[#e5e5e5]" />
          <p className="text-sm text-[#666666]">Aucun examen terminé pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {publiees.map((p) => {
            const s = p.session;
            const res = RESULTAT_CONFIG[p.resultat ?? ""] ?? null;
            const valides = p.evaluations.filter((e) => e.statut === "VALIDE").length;
            const total = s.criteres.length;
            return (
              <div key={p.id} className="bg-white rounded-[16px] shadow-sm overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#1a1a1a]">
                      Ceinture {BELT_LABELS[s.ceintureCible] ?? s.ceintureCible}
                      <span className="text-sm font-normal text-[#999999] ml-2">· {SECTION_LABELS[s.section] ?? s.section}</span>
                    </p>
                    <p className="text-xs text-[#999999] mt-0.5">
                      {format(new Date(s.date), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  {res && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${res.bg} ${res.color}`}>
                      {res.label}
                    </span>
                  )}
                </div>

                {/* Barre de progression */}
                {total > 0 && (
                  <div className="px-5 py-3 border-b border-[#f5f5f5]">
                    <div className="flex items-center justify-between text-xs text-[#666666] mb-1.5">
                      <span>Critères validés</span>
                      <span className="font-semibold text-[#1a1a1a]">{valides}/{total}</span>
                    </div>
                    <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all duration-700"
                        style={{ width: total > 0 ? `${(valides / total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                )}

                {/* Critères */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">Critères évalués</p>
                  <div className="space-y-2">
                    {s.criteres.map((c) => {
                      const ev = p.evaluations.find((e) => e.critereId === c.id);
                      const cfg = EVAL_CONFIG[ev?.statut ?? "NON_EVALUE"];
                      return (
                        <div key={c.id} className="flex items-center gap-3 py-1.5 border-b border-[#f5f5f5] last:border-0">
                          <span className={`text-base font-bold flex-shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                          <span className="flex-1 text-sm text-[#1a1a1a]">{c.nom}</span>
                          <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes prof */}
                {p.notesProf && (
                  <div className="px-5 pb-4">
                    <div className="bg-[#f9f9f9] rounded-[10px] p-4">
                      <p className="text-xs font-semibold text-[#666666] mb-1.5">Commentaire du professeur</p>
                      <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{p.notesProf}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
