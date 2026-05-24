import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const mois = parseInt(searchParams.get("mois") ?? "0");
  const annee = parseInt(searchParams.get("annee") ?? "0");

  const where = mois && annee ? { mois, annee } : {};

  const paiements = await prisma.paiement.findMany({
    where,
    include: { eleve: { select: { nom: true, prenom: true, actif: true } } },
    orderBy: [{ annee: "desc" }, { mois: "desc" }, { eleve: { nom: "asc" } }],
  });

  return NextResponse.json(paiements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { mois, annee, montant } = await req.json();
  if (!mois || !annee) return NextResponse.json({ error: "mois et annee requis" }, { status: 400 });

  const eleveActifs = await prisma.eleve.findMany({ where: { actif: true }, select: { id: true } });

  let created = 0;
  for (const eleve of eleveActifs) {
    const existing = await prisma.paiement.findUnique({ where: { eleveId_mois_annee: { eleveId: eleve.id, mois, annee } } });
    if (!existing) {
      await prisma.paiement.create({ data: { eleveId: eleve.id, mois, annee, montant: montant ?? 50, statut: "EN_ATTENTE" } });
      created++;
    }
  }

  return NextResponse.json({ created });
}
