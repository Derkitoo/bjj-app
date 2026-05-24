import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const eleveId = (session.user as { eleveId?: string }).eleveId;
  if (!eleveId) return NextResponse.json({ error: "Pas d'élève associé" }, { status: 404 });

  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: { presences: true },
  });

  if (!eleve) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

  return NextResponse.json({
    nom: eleve.nom,
    prenom: eleve.prenom,
    ceinture: eleve.ceinture,
    totalPresences: eleve.presences.length,
  });
}
