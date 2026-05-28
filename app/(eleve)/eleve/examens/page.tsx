import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X, Minus, ClipboardList } from "lucide-react";

const CEINTURE_LABEL: Record<string, string> = {
  BLEUE: "🔵 Bleue", VIOLETTE: "🟣 Violette", MARRON: "🟤 Marron", NOIRE: "⚫ Noire",
};

const STATUT_EXAM: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En cours",  color: "text-orange-700", bg: "bg-orange-100" },
  REUSSI:     { label: "Réussi ✓",  color: "text-green-700",  bg: "bg-green-100" },
  ECHOUE:     { label: "Échoué",    color: "text-red-700",    bg: "bg-red-100" },
};

const STATUT_TECH: Record<string, { label: string; icon: typeof Check; color: string }> = {
  NON_EVALUE: { label: "Non évalué",       icon: Minus, color: "text-[#999999]" },
  EN_COURS:   { label: "En cours",         icon: Minus, color: "text-orange-500" },
  MAITRISE:   { label: "Maîtrisé",         icon: Check, color: "text-green-600" },
  ECHOUE:     { label: "À retravailler",   icon: X,     color: "text-red-500" },
};

export default async function MesExamensPage() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ELEVE") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    select: { eleveId: true },
  });

  const examens = user?.eleveId
    ? await prisma.examen.findMany({
        where: { eleveId: user.eleveId },
        include: { techniques: { orderBy: { ordre: "asc" } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
        <ClipboardList size={22} className="text-[#cc0000]" />
        Mes examens
      </h1>

      {examens.length === 0 ? (
        <div className="bg-white rounded-[12px] shadow-sm p-12 text-center">
          <ClipboardList size={40} className="mx-auto mb-3 text-[#e5e5e5]" />
          <p className="text-sm text-[#666666]">Aucun examen enregistré pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {examens.map((ex) => {
            const sc = STATUT_EXAM[ex.statut] ?? STATUT_EXAM.EN_ATTENTE;
            const nbMaitrises = ex.techniques.filter((t) => t.statut === "MAITRISE").length;
            const total = ex.techniques.length;
            return (
              <div key={ex.id} className="bg-white rounded-[12px] shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[#1a1a1a]">
                      Examen — {CEINTURE_LABEL[ex.ceintureCible] ?? ex.ceintureCible}
                    </p>
                    {ex.date && (
                      <p className="text-xs text-[#999999] mt-0.5">
                        {format(new Date(ex.date), "d MMMM yyyy", { locale: fr })}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${sc.bg} ${sc.color}`}>
                    {sc.label}
                  </span>
                </div>

                {/* Progression */}
                {total > 0 && (
                  <div className="px-5 py-3 border-b border-[#f5f5f5]">
                    <div className="flex items-center justify-between text-xs text-[#666666] mb-1.5">
                      <span>Progression</span>
                      <span className="font-semibold text-[#1a1a1a]">{nbMaitrises}/{total} maîtrisées</span>
                    </div>
                    <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all duration-700"
                        style={{ width: `${(nbMaitrises / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Techniques */}
                {ex.techniques.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">
                      Techniques évaluées
                    </p>
                    <div className="space-y-2">
                      {ex.techniques.map((t) => {
                        const st = STATUT_TECH[t.statut] ?? STATUT_TECH.NON_EVALUE;
                        const Icon = st.icon;
                        return (
                          <div key={t.id} className="flex items-start gap-3">
                            <Icon size={16} className={`mt-0.5 flex-shrink-0 ${st.color}`} />
                            <div className="flex-1">
                              <p className="text-sm text-[#1a1a1a]">{t.nom}</p>
                              {t.commentaire && (
                                <p className="text-xs text-[#666666] mt-0.5 italic">{t.commentaire}</p>
                              )}
                            </div>
                            <span className={`text-xs flex-shrink-0 ${st.color}`}>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes du prof */}
                {ex.notesProf && (
                  <div className="px-5 pb-4">
                    <div className="bg-[#f9f9f9] rounded-[10px] p-4">
                      <p className="text-xs font-semibold text-[#666666] mb-1.5">
                        Commentaire du professeur
                      </p>
                      <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{ex.notesProf}</p>
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
