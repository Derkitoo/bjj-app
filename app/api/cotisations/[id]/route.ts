import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function computeStatut(echeances: { statut: string; dateLimite: Date }[]): string {
  const now = new Date();
  if (echeances.every((e) => e.statut === "PAYE")) return "COMPLETE";
  if (echeances.some((e) => e.statut !== "PAYE" && new Date(e.dateLimite) < now)) return "EN_RETARD";
  if (echeances.some((e) => e.statut === "PAYE")) return "EN_COURS";
  return "EN_ATTENTE";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const cotisation = await prisma.cotisation.findUnique({
    where: { id },
    include: {
      eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true, nomFamille: true } },
      echeances: { orderBy: { numero: "asc" } },
    },
  });

  if (!cotisation) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(cotisation);
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { notes, reductionManuelle, statut, changeMode } = body;

  const existing = await prisma.cotisation.findUnique({
    where: { id },
    include: { echeances: true },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (changeMode !== undefined) {
    const nb = parseInt(changeMode);
    if (nb !== 1 && nb !== 3) {
      return NextResponse.json({ error: "Mode invalide (1 ou 3)" }, { status: 400 });
    }
    const hasPaid = existing.echeances.some((e) => e.statut === "PAYE");
    if (hasPaid) {
      return NextResponse.json({ error: "Impossible de modifier le mode : des échéances sont déjà payées" }, { status: 409 });
    }

    const dates = getEcheanceDates(existing.saison, nb);
    const montantEch = parseFloat((existing.montantTotal / nb).toFixed(2));

    await prisma.echeance.deleteMany({ where: { cotisationId: id } });

    const cotisation = await prisma.cotisation.update({
      where: { id },
      data: {
        nbEcheances: nb,
        statut: "EN_ATTENTE",
        echeances: {
          create: dates.map((date, i) => ({
            numero: i + 1,
            montant: i === nb - 1
              ? parseFloat((existing.montantTotal - montantEch * (nb - 1)).toFixed(2))
              : montantEch,
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

    return NextResponse.json(cotisation);
  }

  const updateData: Record<string, unknown> = {};
  if (notes !== undefined) updateData.notes = notes;
  if (reductionManuelle !== undefined) {
    updateData.reductionManuelle = reductionManuelle;
    updateData.montantTotal = Math.max(
      0,
      existing.montantBase - existing.reductionRenouvellement - existing.reductionFamille - reductionManuelle
    );
  }
  if (statut !== undefined) updateData.statut = statut;

  const cotisation = await prisma.cotisation.update({
    where: { id },
    data: updateData,
    include: {
      eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true, nomFamille: true } },
      echeances: { orderBy: { numero: "asc" } },
    },
  });

  return NextResponse.json(cotisation);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.cotisation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export { computeStatut };
