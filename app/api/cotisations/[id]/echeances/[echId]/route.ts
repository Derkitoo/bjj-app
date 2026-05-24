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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; echId: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id, echId } = await params;
  const { statut, modePaiement, note } = await req.json();

  const echeance = await prisma.echeance.update({
    where: { id: echId },
    data: {
      statut,
      modePaiement: modePaiement || null,
      datePaiement: statut === "PAYE" ? new Date() : null,
      note: note || null,
    },
  });

  const allEcheances = await prisma.echeance.findMany({
    where: { cotisationId: id },
    select: { statut: true, dateLimite: true },
  });

  const newStatut = computeStatut(allEcheances);
  await prisma.cotisation.update({ where: { id }, data: { statut: newStatut } });

  return NextResponse.json({ echeance, cotisationStatut: newStatut });
}
