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
    },
  });

  if (!eleve) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

  const nextBelt = NEXT_BELT[eleve.ceinture] ?? null;
  const progression = nextBelt ? Math.round((eleve.barrettes / 4) * 100) : 100;

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
  });
}
