import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const examen = await prisma.examen.findUnique({
    where: { id },
    include: {
      eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true } },
      techniques: { orderBy: { ordre: "asc" } },
    },
  });

  if (!examen) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(examen);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { statut, notesProf, date, techniques } = body;

  const existing = await prisma.examen.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (statut !== undefined) updateData.statut = statut;
  if (notesProf !== undefined) updateData.notesProf = notesProf;
  if (date !== undefined) updateData.date = date ? new Date(date) : null;

  if (techniques !== undefined) {
    await prisma.examenTechnique.deleteMany({ where: { examenId: id } });
    updateData.techniques = {
      create: (techniques as { nom: string; statut?: string; commentaire?: string }[]).map((t, i) => ({
        nom: t.nom,
        statut: t.statut ?? "NON_EVALUE",
        commentaire: t.commentaire ?? null,
        ordre: i,
      })),
    };
  }

  const examen = await prisma.examen.update({
    where: { id },
    data: updateData,
    include: {
      eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true } },
      techniques: { orderBy: { ordre: "asc" } },
    },
  });

  return NextResponse.json(examen);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.examen.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
