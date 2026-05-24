import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getSaisonPrecedente(saison: string): string {
  const [y1, y2] = saison.split("-").map(Number);
  return `${y1 - 1}-${y2 - 1}`;
}

function getEcheanceDates(saison: string, nb: number): Date[] {
  const startYear = parseInt(saison.split("-")[0]);
  if (nb === 1) return [new Date(startYear, 8, 1)];
  return [
    new Date(startYear, 8, 1),
    new Date(startYear + 1, 0, 15),
    new Date(startYear + 1, 3, 1),
  ];
}

function computeStatut(echeances: { statut: string; dateLimite: Date }[]): string {
  const now = new Date();
  if (echeances.every((e) => e.statut === "PAYE")) return "COMPLETE";
  if (echeances.some((e) => e.statut !== "PAYE" && new Date(e.dateLimite) < now)) return "EN_RETARD";
  if (echeances.some((e) => e.statut === "PAYE")) return "EN_COURS";
  return "EN_ATTENTE";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const saison = searchParams.get("saison") ?? "";
  const eleveId = searchParams.get("eleveId") ?? "";

  const cotisations = await prisma.cotisation.findMany({
    where: {
      saison: saison || undefined,
      eleveId: eleveId || undefined,
    },
    include: {
      eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true, actif: true, nomFamille: true } },
      echeances: { orderBy: { numero: "asc" } },
    },
    orderBy: { eleve: { nom: "asc" } },
  });

  return NextResponse.json(cotisations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { eleveId, saison, montantBase, reductionRenouvellement = 0, reductionFamille = 0, reductionManuelle = 0, nbEcheances = 1, notes } = body;

  if (!eleveId || !saison || !montantBase) {
    return NextResponse.json({ error: "eleveId, saison et montantBase requis" }, { status: 400 });
  }

  const existing = await prisma.cotisation.findUnique({ where: { eleveId_saison: { eleveId, saison } } });
  if (existing) return NextResponse.json({ error: "Cotisation déjà existante pour cette saison" }, { status: 409 });

  const montantTotal = Math.max(0, montantBase - reductionRenouvellement - reductionFamille - reductionManuelle);
  const dates = getEcheanceDates(saison, nbEcheances);
  const montantEcheance = parseFloat((montantTotal / nbEcheances).toFixed(2));

  const cotisation = await prisma.cotisation.create({
    data: {
      eleveId,
      saison,
      montantBase,
      reductionRenouvellement,
      reductionFamille,
      reductionManuelle,
      montantTotal,
      nbEcheances,
      statut: "EN_ATTENTE",
      notes: notes || null,
      echeances: {
        create: dates.map((date, i) => ({
          numero: i + 1,
          montant: i === nbEcheances - 1
            ? parseFloat((montantTotal - montantEcheance * (nbEcheances - 1)).toFixed(2))
            : montantEcheance,
          dateLimite: date,
          statut: "EN_ATTENTE",
        })),
      },
    },
    include: {
      eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true, nomFamille: true } },
      echeances: { orderBy: { numero: "asc" } },
    },
  });

  return NextResponse.json(cotisation, { status: 201 });
}
