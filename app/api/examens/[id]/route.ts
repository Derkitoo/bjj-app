import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSession(id: string) {
  return prisma.examenSession.findUnique({
    where: { id },
    include: {
      criteres: { orderBy: { ordre: "asc" } },
      participants: {
        include: {
          eleve: { select: { id: true, nom: true, prenom: true, ceinture: true, barrettes: true } },
          evaluations: true,
        },
      },
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const data = await getSession(id);
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (action === "statut") {
    await prisma.examenSession.update({ where: { id }, data: { statut: body.statut } });
    return NextResponse.json({ success: true });
  }

  if (action === "evaluer") {
    // { evaluations: [{ participantId, critereId, statut }], resultats: [{ participantId, resultat, notesProf }] }
    const { evaluations, resultats } = body;

    for (const ev of evaluations ?? []) {
      await prisma.examenEvaluation.updateMany({
        where: { participantId: ev.participantId, critereId: ev.critereId },
        data: { statut: ev.statut },
      });
    }
    for (const r of resultats ?? []) {
      await prisma.examenParticipant.update({
        where: { id: r.participantId },
        data: { resultat: r.resultat ?? null, notesProf: r.notesProf ?? null },
      });
    }

    const data = await getSession(id);
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.examenSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
