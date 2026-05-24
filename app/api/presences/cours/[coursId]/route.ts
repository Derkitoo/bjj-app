import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ coursId: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { coursId } = await params;

  const presences = await prisma.presence.findMany({
    where: { coursId },
    include: { eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true, categorie: true } } },
    orderBy: { eleve: { nom: "asc" } },
  });

  return NextResponse.json(presences);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ coursId: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { coursId } = await params;
  const { eleveId } = await req.json();

  if (!eleveId) return NextResponse.json({ error: "eleveId requis" }, { status: 400 });

  const existing = await prisma.presence.findUnique({
    where: { eleveId_coursId: { eleveId, coursId } },
  });
  if (existing) return NextResponse.json({ error: "Présence déjà enregistrée" }, { status: 409 });

  const presence = await prisma.presence.create({
    data: { eleveId, coursId },
    include: { eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true, categorie: true } } },
  });

  return NextResponse.json(presence, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ coursId: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { coursId } = await params;
  const { searchParams } = new URL(req.url);
  const eleveId = searchParams.get("eleveId");

  if (!eleveId) return NextResponse.json({ error: "eleveId requis" }, { status: 400 });

  await prisma.presence.delete({
    where: { eleveId_coursId: { eleveId, coursId } },
  });

  return NextResponse.json({ success: true });
}
