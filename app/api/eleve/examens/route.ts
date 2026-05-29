import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const eleveId = (session?.user as { eleveId?: string })?.eleveId;
  if (!session || !eleveId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const participations = await prisma.examenParticipant.findMany({
    where: { eleveId },
    include: {
      session: {
        include: { criteres: { orderBy: { ordre: "asc" } } },
      },
      evaluations: {
        include: { critere: true },
      },
    },
    orderBy: { session: { date: "desc" } },
  });

  return NextResponse.json(participations);
}
