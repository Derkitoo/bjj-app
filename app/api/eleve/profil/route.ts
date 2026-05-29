import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";

const NEXT_BELT: Record<string, string> = { BLANCHE: "BLEUE", BLEUE: "VIOLETTE", VIOLETTE: "MARRON", MARRON: "NOIRE" };

function getProchainCours(cours: { id: string; type: string; jour: number; heureDebut: string; duree: number }[]) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const withOffset = cours.map((c) => {
    const [h, m] = c.heureDebut.split(":").map(Number);
    const coursMinutes = h * 60 + m;
    let daysUntil = c.jour - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && coursMinutes <= currentTime)) {
      daysUntil += 7;
    }
    return { ...c, daysUntil, coursMinutes };
  });

  withOffset.sort((a, b) => a.daysUntil - b.daysUntil || a.coursMinutes - b.coursMinutes);
  return withOffset[0] ?? null;
}

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const TYPES: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Enfants", COMPETITION: "Compétition", OPEN_MAT: "Open Mat" };

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const eleveId = (session.user as { eleveId?: string }).eleveId;
  if (!eleveId) return NextResponse.json({ error: "Pas d'élève associé" }, { status: 404 });

  const today = new Date();

  const [eleve, coursActifs, examenEnCours] = await Promise.all([
    prisma.eleve.findUnique({
      where: { id: eleveId },
      include: {
        presences: {
          orderBy: { date: "desc" },
          take: 1,
          include: { cours: { select: { type: true } } },
        },
        _count: { select: { presences: true } },
      },
    }),
    prisma.cours.findMany({
      where: { annule: false, recurrent: true },
      select: { id: true, type: true, jour: true, heureDebut: true, duree: true },
    }),
    prisma.examen.findFirst({
      where: { eleveId, statut: "EN_ATTENTE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, ceintureCible: true, techniques: { select: { statut: true } } },
    }),
  ]);

  if (!eleve) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

  const nextBelt = NEXT_BELT[eleve.ceinture] ?? null;
  const progression = nextBelt ? Math.round((eleve.barrettes / 4) * 100) : 100;

  const presencesMois = await prisma.presence.count({
    where: { eleveId, date: { gte: startOfMonth(today) } },
  });

  const derniereCours = eleve.presences[0]
    ? { date: eleve.presences[0].date.toISOString(), type: TYPES[eleve.presences[0].cours.type] ?? eleve.presences[0].cours.type }
    : null;

  const prochain = getProchainCours(coursActifs);
  const prochainCours = prochain
    ? {
        jour: JOURS[prochain.jour],
        heure: prochain.heureDebut,
        type: TYPES[prochain.type] ?? prochain.type,
        daysUntil: prochain.daysUntil,
        duree: prochain.duree,
      }
    : null;

  const examen = examenEnCours
    ? {
        id: examenEnCours.id,
        ceintureCible: examenEnCours.ceintureCible,
        nbMaitrises: examenEnCours.techniques.filter((t) => t.statut === "MAITRISE").length,
        total: examenEnCours.techniques.length,
      }
    : null;

  return NextResponse.json({
    nom: eleve.nom,
    prenom: eleve.prenom,
    ceinture: eleve.ceinture,
    barrettes: eleve.barrettes,
    totalPresences: eleve._count.presences,
    presencesMois,
    nextBelt,
    progression,
    derniereCours,
    prochainCours,
    examenEnCours: examen,
  });
}
