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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const {
    saison,
    montantBase,
    montantRenouvellement = 0,
    montantFamille = 0,
    nbEcheances = 1,
  } = await req.json();

  if (!saison || !montantBase) {
    return NextResponse.json({ error: "saison et montantBase requis" }, { status: 400 });
  }

  const saisonPrec = getSaisonPrecedente(saison);

  const eleveActifs = await prisma.eleve.findMany({
    where: { actif: true },
    select: { id: true, nomFamille: true },
  });

  const cotisationsExistantes = await prisma.cotisation.findMany({
    where: { saison },
    select: { eleveId: true, eleve: { select: { nomFamille: true } } },
  });
  const dejaCrees = new Set(cotisationsExistantes.map((c) => c.eleveId));

  const cotisationsPrec = await prisma.cotisation.findMany({
    where: { saison: saisonPrec, statut: { not: "ANNULE" } },
    select: { eleveId: true },
  });
  const anciensEleves = new Set(cotisationsPrec.map((c) => c.eleveId));

  const famillesDejaCrees = new Set<string>();
  cotisationsExistantes.forEach((c) => {
    if (c.eleve.nomFamille) famillesDejaCrees.add(c.eleve.nomFamille);
  });

  let created = 0;
  let skipped = 0;
  const dates = getEcheanceDates(saison, nbEcheances);

  for (const eleve of eleveActifs) {
    if (dejaCrees.has(eleve.id)) { skipped++; continue; }

    const estRenouvellement = anciensEleves.has(eleve.id);
    const estFamille = eleve.nomFamille ? famillesDejaCrees.has(eleve.nomFamille) : false;

    const redRenouv = estRenouvellement ? montantRenouvellement : 0;
    const redFamille = estFamille ? montantFamille : 0;
    const montantTotal = Math.max(0, montantBase - redRenouv - redFamille);
    const montantEcheance = parseFloat((montantTotal / nbEcheances).toFixed(2));

    await prisma.cotisation.create({
      data: {
        eleveId: eleve.id,
        saison,
        montantBase,
        reductionRenouvellement: redRenouv,
        reductionFamille: redFamille,
        reductionManuelle: 0,
        montantTotal,
        nbEcheances,
        statut: "EN_ATTENTE",
        echeances: {
          create: dates.map((date, i) => ({
            numero: i + 1,
            montant:
              i === nbEcheances - 1
                ? parseFloat((montantTotal - montantEcheance * (nbEcheances - 1)).toFixed(2))
                : montantEcheance,
            dateLimite: date,
            statut: "EN_ATTENTE",
          })),
        },
      },
    });

    if (eleve.nomFamille) famillesDejaCrees.add(eleve.nomFamille);
    created++;
  }

  return NextResponse.json({ created, skipped }, { status: 201 });
}
