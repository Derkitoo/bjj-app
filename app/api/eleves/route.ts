import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genererMotDePasseTemporaire, hasherMotDePasse } from "@/lib/password";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ceinture = searchParams.get("ceinture");
  const statut = searchParams.get("statut");

  const eleves = await prisma.eleve.findMany({
    where: {
      ceinture: ceinture ? (ceinture as never) : undefined,
      actif: statut === "inactif" ? false : statut === "actif" ? true : undefined,
    },
    include: { presences: { orderBy: { date: "desc" }, take: 1 } },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(eleves);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { nom, prenom, email, telephone, dateNaissance, ceinture, barrettes, notes } = body;

  if (!nom || !prenom) {
    return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400 });
  }

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
  }

  const eleve = await prisma.eleve.create({
    data: {
      nom,
      prenom,
      email: email || null,
      telephone: telephone || null,
      dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
      ceinture: ceinture || "BLANCHE",
      barrettes: barrettes ?? 0,
      notes: notes || null,
    },
  });

  let mdpTemporaire: string | null = null;
  if (email) {
    mdpTemporaire = genererMotDePasseTemporaire();
    const hash = await hasherMotDePasse(mdpTemporaire);
    await prisma.user.create({
      data: { email, password: hash, role: "ELEVE", eleveId: eleve.id, motDePasseTemporaire: true },
    });
  }

  return NextResponse.json({ eleve, mdpTemporaire }, { status: 201 });
}
