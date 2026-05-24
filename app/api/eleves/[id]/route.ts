import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: {
      presences: { orderBy: { date: "desc" }, include: { cours: true } },
      promotions: { orderBy: { date: "desc" } },
    },
  });

  if (!eleve) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
  return NextResponse.json(eleve);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
    nom, prenom, email, telephone, dateNaissance, ceinture, notes, actif,
    poids, taille, adresse, ville, codePostal, contactUrgence, telUrgence,
    niveauSport, objectifs, medical,
  } = body;

  const eleve = await prisma.eleve.update({
    where: { id },
    data: {
      nom,
      prenom,
      email: email || null,
      telephone: telephone || null,
      dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
      ceinture,
      notes: notes || null,
      actif,
      poids: poids ? parseFloat(poids) : null,
      taille: taille ? parseFloat(taille) : null,
      adresse: adresse || null,
      ville: ville || null,
      codePostal: codePostal || null,
      contactUrgence: contactUrgence || null,
      telUrgence: telUrgence || null,
      niveauSport: niveauSport || null,
      objectifs: objectifs || null,
      medical: medical || null,
    },
  });

  return NextResponse.json(eleve);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.eleve.update({ where: { id }, data: { actif: false } });
  return NextResponse.json({ success: true });
}
