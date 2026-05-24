import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const { statut } = await req.json();

  const paiement = await prisma.paiement.update({
    where: { id },
    data: {
      statut,
      date: statut === "PAYE" ? new Date() : null,
    },
  });

  return NextResponse.json(paiement);
}
