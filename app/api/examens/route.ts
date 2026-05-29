import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const sessions = await prisma.examenSession.findMany({
    include: {
      criteres: { orderBy: { ordre: "asc" } },
      participants: {
        include: {
          eleve: { select: { id: true, nom: true, prenom: true, ceinture: true } },
          evaluations: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { date, ceintureCible, section, notes, criteres, eleveIds } = body;

  if (!date || !ceintureCible || !criteres?.length || !eleveIds?.length) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const examenSession = await prisma.examenSession.create({
    data: {
      date: new Date(date),
      ceintureCible,
      section: section ?? "GI",
      notes: notes ?? null,
      criteres: {
        create: (criteres as string[]).map((nom, i) => ({ nom, ordre: i })),
      },
      participants: {
        create: (eleveIds as string[]).map((eleveId) => ({ eleveId })),
      },
    },
    include: {
      criteres: true,
      participants: true,
    },
  });

  // Créer les évaluations vides pour chaque participant × critère
  for (const participant of examenSession.participants) {
    for (const critere of examenSession.criteres) {
      await prisma.examenEvaluation.create({
        data: { participantId: participant.id, critereId: critere.id },
      });
    }
  }

  return NextResponse.json(examenSession, { status: 201 });
}
