import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";

const NEXT_BELT: Record<string, string> = { BLANCHE: "BLEUE", BLEUE: "VIOLETTE", VIOLETTE: "MARRON", MARRON: "NOIRE" };

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const eleveId = (session.user as { eleveId?: string }).eleveId;
  if (!eleveId) return NextResponse.json({ error: "Pas d'élève associé" }, { status: 404 });

  const today = new Date();

  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: {
      presences: { orderBy: { date: "desc" } },
      promotions: { orderBy: { date: "desc" }, take: 1 },
    },
  });

  if (!eleve) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

  const nextBelt = NEXT_BELT[eleve.ceinture] ?? null;
  let progression = 100;

  if (nextBelt) {
    const critere = await prisma.criterePromotion.findUnique({ where: { ceintureCible: nextBelt } });
    if (critere) {
      const lastPromo = eleve.promotions[0];
      const refDate = lastPromo ? new Date(lastPromo.date) : new Date(eleve.dateInscription);
      const moisDepuis = (today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      const progCours = critere.minCours > 0 ? Math.min(eleve.presences.length / critere.minCours, 1) : 1;
      const progMois = critere.minMois > 0 ? Math.min(moisDepuis / critere.minMois, 1) : 1;
      progression = Math.round(((progCours + progMois) / 2) * 100);
    } else {
      progression = 0;
    }
  }

  const presencesMois = eleve.presences.filter(
    (p) => new Date(p.date) >= startOfMonth(today)
  ).length;

  return NextResponse.json({
    nom: eleve.nom,
    prenom: eleve.prenom,
    ceinture: eleve.ceinture,
    barrettes: eleve.barrettes,
    totalPresences: eleve.presences.length,
    presencesMois,
    nextBelt,
    progression,
    dateInscription: eleve.dateInscription.toISOString(),
  });
}
