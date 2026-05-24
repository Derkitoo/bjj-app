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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { notes, reductionManuelle, statut } = body;

  const existing = await prisma.cotisation.findUnique({
    where: { id },
    include: { echeances: true },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

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
