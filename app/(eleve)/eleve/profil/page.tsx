import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CeintureBadge from "@/components/CeintureBadge";
import { format, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Award, Calendar, CheckSquare, TrendingUp } from "lucide-react";

const BELT_BG: Record<string, string> = {
  BLANCHE: "#e5e5e5", BLEUE: "#3b82f6", VIOLETTE: "#8b5cf6", MARRON: "#92400e", NOIRE: "#111111",
};

export default async function ProfilElevePage() {
  const session = await auth();
  const eleveId = (session?.user as { eleveId?: string })?.eleveId;
  if (!eleveId) redirect("/login");

  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: {
      presences: { orderBy: { date: "desc" } },
      promotions: { orderBy: { date: "asc" } },
    },
  });
  if (!eleve) redirect("/login");

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const presencesMois = eleve.presences.filter((p) => new Date(p.date) >= startOfMonth).length;
  const moisMembre = differenceInMonths(today, new Date(eleve.dateInscription)) || 1;
  const moyenneMois = Math.round(eleve.presences.length / moisMembre);

  const timeline = [
    { ceinture: "BLANCHE", date: eleve.dateInscription, label: "Inscription" },
    ...eleve.promotions.map((p) => ({ ceinture: p.ceinture, date: p.date, label: `Ceinture ${p.ceinture.toLowerCase()}` })),
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* ── Carte identité ── */}
      <div className="bg-white rounded-[20px] shadow-sm overflow-hidden animate-fade-up">
        <div className="h-20 relative" style={{ background: `linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))` }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 80% -20%, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}>
              {eleve.prenom[0]}{eleve.nom[0]}
            </div>
            <div className="pb-1">
              <h1 className="text-lg font-bold text-[#1a1a1a]">{eleve.prenom} {eleve.nom}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} size="sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#666666]">
            <Calendar size={12} />
            Membre depuis {format(new Date(eleve.dateInscription), "MMMM yyyy", { locale: fr })}
            <span className="text-[#cccccc]">·</span>
            {moisMembre} mois
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
        {[
          { icon: CheckSquare, value: eleve.presences.length, label: "Cours total" },
          { icon: TrendingUp, value: presencesMois, label: "Ce mois" },
          { icon: Award, value: moyenneMois, label: "Moy/mois" },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="bg-white rounded-[16px] shadow-sm p-3 text-center">
            <Icon size={16} className="mx-auto mb-1.5" style={{ color: "var(--color-primary)" }} />
            <p className="text-2xl font-bold text-[#1a1a1a]">{value}</p>
            <p className="text-[10px] text-[#666666] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Timeline parcours ── */}
      <div className="bg-white rounded-[20px] shadow-sm p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <h2 className="font-bold text-[#1a1a1a] mb-5 flex items-center gap-2">
          <Award size={17} style={{ color: "var(--color-primary)" }} />
          Mon parcours
        </h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: "var(--c-border, #e5e5e5)" }} />
          <div className="space-y-0">
            {timeline.map((step, i) => {
              const isLast = i === timeline.length - 1;
              const isCurrent = isLast;
              return (
                <div key={i} className="flex items-start gap-4 relative pb-5 last:pb-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm"
                    style={{
                      backgroundColor: BELT_BG[step.ceinture] ?? "#999",
                      boxShadow: isCurrent ? `0 0 0 3px ${BELT_BG[step.ceinture]}40` : undefined,
                    }}>
                    {isCurrent && (
                      <span className="text-xs text-white font-bold">★</span>
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1a1a1a] capitalize">{step.label}</p>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                          Actuelle
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#999999] mt-0.5">
                      {format(new Date(step.date), "d MMMM yyyy", { locale: fr })}
                    </p>
                    {!isLast && i < timeline.length - 1 && (
                      <p className="text-xs text-[#bbbbbb] mt-0.5">
                        {differenceInMonths(new Date(timeline[i + 1].date), new Date(step.date))} mois à ce niveau
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {timeline.length === 1 && (
          <p className="text-xs text-[#aaaaaa] mt-2 ml-12">Tes promotions apparaîtront ici</p>
        )}
      </div>

      {/* ── Dernières présences ── */}
      {eleve.presences.length > 0 && (
        <div className="bg-white rounded-[20px] shadow-sm p-5 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <h2 className="font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
            <CheckSquare size={17} style={{ color: "var(--color-primary)" }} />
            Dernières présences
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {eleve.presences.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "var(--color-primary)" }} />
                <span className="text-sm text-[#666666]">
                  {format(new Date(p.date), "EEEE d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            ))}
          </div>
          {eleve.presences.length > 6 && (
            <p className="text-xs text-[#aaaaaa] mt-3">+ {eleve.presences.length - 6} autres cours</p>
          )}
        </div>
      )}
    </div>
  );
}
