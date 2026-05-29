import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CeintureBadge from "@/components/CeintureBadge";
import { format, differenceInMonths, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Award, Calendar, CheckSquare, TrendingUp, Clock } from "lucide-react";

const BELT_GRADIENT: Record<string, { from: string; to: string; text: string }> = {
  BLANCHE:  { from: "#f5f5f5",  to: "#e0e0e0",  text: "#1a1a1a" },
  BLEUE:    { from: "#1d4ed8",  to: "#1e3a8a",  text: "#ffffff" },
  VIOLETTE: { from: "#7c3aed",  to: "#5b21b6",  text: "#ffffff" },
  MARRON:   { from: "#92400e",  to: "#78350f",  text: "#ffffff" },
  NOIRE:    { from: "#1a1a1a",  to: "#000000",  text: "#ffffff" },
};

const BELT_DOT: Record<string, string> = {
  BLANCHE: "#cccccc", BLEUE: "#3b82f6", VIOLETTE: "#8b5cf6", MARRON: "#92400e", NOIRE: "#1a1a1a",
};

const BELT_LABEL: Record<string, string> = {
  BLANCHE: "Blanche", BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire",
};

const TYPES: Record<string, string> = {
  GI: "Gi", NO_GI: "No-Gi", KIDS: "Enfants", COMPETITION: "Compétition", OPEN_MAT: "Open Mat",
};

export default async function ProfilElevePage() {
  const session = await auth();
  const eleveId = (session?.user as { eleveId?: string })?.eleveId;
  if (!eleveId) redirect("/login");

  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: {
      presences: {
        orderBy: { date: "desc" },
        take: 10,
        include: { cours: { select: { type: true } } },
      },
      promotions: { orderBy: { date: "asc" } },
    },
  });
  if (!eleve) redirect("/login");

  const today = new Date();
  const debutMois = new Date(today.getFullYear(), today.getMonth(), 1);
  const totalPresences = await prisma.presence.count({ where: { eleveId } });
  const presencesMois = eleve.presences.filter((p) => new Date(p.date) >= debutMois).length;
  const moisMembre = Math.max(1, differenceInMonths(today, new Date(eleve.dateInscription)));
  const moyenneMois = Math.round(totalPresences / moisMembre);

  const derniere = eleve.presences[0] ?? null;
  const joursDepuis = derniere ? differenceInDays(today, new Date(derniere.date)) : null;

  const belt = eleve.ceinture;
  const beltStyle = BELT_GRADIENT[belt] ?? BELT_GRADIENT.BLANCHE;
  const isLight = belt === "BLANCHE";

  const timeline = [
    { ceinture: "BLANCHE" as string, date: eleve.dateInscription as Date, label: "Inscription", isCurrent: eleve.promotions.length === 0 },
    ...eleve.promotions.map((p, i) => ({
      ceinture: p.ceinture,
      date: p.date,
      label: `Ceinture ${BELT_LABEL[p.ceinture] ?? p.ceinture}`,
      isCurrent: i === eleve.promotions.length - 1,
    })),
  ];

  return (
    <div className="pb-6 max-w-4xl">{/* hero pleine largeur, contenu limité à 4xl sur très grands écrans */}

      {/* ── Hero ── */}
      <div
        className="rounded-[20px] overflow-hidden shadow-sm mb-4"
        style={{ background: `linear-gradient(135deg, ${beltStyle.from}, ${beltStyle.to})` }}
      >
        <div className="relative px-6 pt-6 pb-5">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 90% 10%, rgba(255,255,255,0.6) 0%, transparent 55%)" }} />

          <div className="flex items-center gap-5 relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 border-2"
              style={{
                backgroundColor: isLight ? "#ffffff" : "rgba(255,255,255,0.2)",
                borderColor: isLight ? "#e0e0e0" : "rgba(255,255,255,0.35)",
                color: isLight ? "var(--color-primary)" : "#ffffff",
              }}
            >
              {eleve.prenom[0]}{eleve.nom[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: beltStyle.text }}>
                {eleve.prenom} {eleve.nom}
              </h1>
              <div className="mt-2">
                <CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} size="sm" />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium"
                style={{ color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.65)" }}>
                <Calendar size={11} />
                Membre depuis {format(new Date(eleve.dateInscription), "MMMM yyyy", { locale: fr })}
                <span className="opacity-50">·</span>
                {moisMembre} mois
              </div>
            </div>
          </div>
        </div>

        {/* Bande stats */}
        <div
          className="grid grid-cols-3"
          style={{ backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.25)" }}
        >
          {[
            { icon: CheckSquare, value: totalPresences, label: "Cours total" },
            { icon: TrendingUp,  value: presencesMois,  label: "Ce mois" },
            { icon: Award,       value: moyenneMois,    label: "Moy/mois" },
          ].map(({ icon: Icon, value, label }, idx) => (
            <div key={label}
              className="flex flex-col items-center py-4 px-2"
              style={{ borderLeft: idx > 0 ? `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"}` : undefined }}
            >
              <Icon size={15} style={{ color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.5)" }} className="mb-1.5" />
              <p className="text-2xl font-bold" style={{ color: beltStyle.text }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.55)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grille desktop : 2 colonnes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Colonne gauche */}
        <div className="space-y-4">

          {/* Dernière présence */}
          {derniere && (
            <div className="bg-white rounded-[16px] shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center flex-shrink-0">
                <Clock size={17} className="text-[#666666]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#999999] font-medium uppercase tracking-wide">Dernière présence</p>
                <p className="font-semibold text-[#1a1a1a] mt-0.5">
                  {format(new Date(derniere.date), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-xs text-[#aaaaaa] mt-0.5">
                  {TYPES[derniere.cours.type] ?? derniere.cours.type}
                  {joursDepuis !== null && (
                    <> · {joursDepuis === 0 ? "Aujourd'hui" : joursDepuis === 1 ? "Hier" : `il y a ${joursDepuis} jours`}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Parcours ceintures */}
          <div className="bg-white rounded-[20px] shadow-sm p-5">
            <h2 className="font-bold text-[#1a1a1a] mb-5 flex items-center gap-2">
              <Award size={17} style={{ color: "var(--color-primary)" }} />
              Mon parcours
            </h2>
            <div className="relative pl-4">
              <div className="absolute left-[14px] top-3 bottom-3 w-0.5 bg-[#f0f0f0]" />
              <div className="space-y-5">
                {timeline.map((step, i) => {
                  const nextStep = timeline[i + 1];
                  const duree = nextStep
                    ? differenceInMonths(new Date(nextStep.date), new Date(step.date))
                    : differenceInMonths(today, new Date(step.date));
                  return (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm"
                        style={{ backgroundColor: BELT_DOT[step.ceinture] ?? "#999" }}
                      >
                        {step.isCurrent && <span className="text-[10px] text-white font-bold">★</span>}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#1a1a1a]">{step.label}</p>
                          {step.isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                              Actuelle
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#999999] mt-0.5">
                          {format(new Date(step.date), "d MMMM yyyy", { locale: fr })}
                        </p>
                        {duree > 0 && (
                          <p className="text-xs text-[#cccccc] mt-0.5">
                            {duree} mois {step.isCurrent ? "à ce niveau" : "avant la suivante"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {eleve.promotions.length === 0 && (
              <p className="text-xs text-[#aaaaaa] mt-3 pl-11">Tes promotions apparaîtront ici</p>
            )}
          </div>
        </div>

        {/* Colonne droite — Historique présences */}
        {eleve.presences.length > 0 && (
          <div className="bg-white rounded-[20px] shadow-sm p-5">
            <h2 className="font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
              <CheckSquare size={17} style={{ color: "var(--color-primary)" }} />
              Historique des présences
            </h2>
            <div className="space-y-1">
              {eleve.presences.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[#f5f5f5] last:border-0">
                  <span className="text-sm text-[#1a1a1a]">
                    {format(new Date(p.date), "EEE d MMM yyyy", { locale: fr })}
                  </span>
                  <span className="text-xs font-medium text-[#666666] bg-[#f5f5f5] px-2.5 py-1 rounded-full">
                    {TYPES[p.cours.type] ?? p.cours.type}
                  </span>
                </div>
              ))}
            </div>
            {totalPresences > 10 && (
              <p className="text-xs text-[#aaaaaa] mt-3 text-center">
                + {totalPresences - 10} autres cours
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
