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
    nom, prenom, email, telephone, dateNaissance, ceinture, barrettes, notes, actif,
    poids, taille, adresse, ville, codePostal, contactUrgence, telUrgence,
    niveauSport, objectifs, medical, montantMensuel, typeAbonnement, nomFamille, categorie,
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
      barrettes: barrettes ?? 0,
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
      montantMensuel: montantMensuel ? parseFloat(montantMensuel) : null,
      typeAbonnement: typeAbonnement || "MENSUEL",
      nomFamille: nomFamille || null,
      categorie: categorie || "ADULTES",
    },
  });

  return NextResponse.json(eleve);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);

  // Suppression définitive
  const cotisations = await prisma.cotisation.findMany({ where: { eleveId: id }, select: { id: true } });
  const cotisationIds = cotisations.map((c) => c.id);

  await prisma.$transaction([
    prisma.examenParticipant.deleteMany({ where: { eleveId: id } }),
    prisma.presence.deleteMany({ where: { eleveId: id } }),
    prisma.promotion.deleteMany({ where: { eleveId: id } }),
    prisma.paiement.deleteMany({ where: { eleveId: id } }),
    prisma.echeance.deleteMany({ where: { cotisationId: { in: cotisationIds } } }),
    prisma.cotisation.deleteMany({ where: { eleveId: id } }),
    prisma.user.updateMany({ where: { eleveId: id }, data: { eleveId: null } }),
    prisma.eleve.delete({ where: { id } }),
  ]);
  return NextResponse.json({ success: true });
}
