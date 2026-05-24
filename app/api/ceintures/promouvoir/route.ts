import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { eleveId, nouvelleCeinture } = await req.json();

  if (!eleveId || !nouvelleCeinture) {
    return NextResponse.json({ error: "eleveId et nouvelleCeinture requis" }, { status: 400 });
  }

  const [eleve, promotion] = await Promise.all([
    prisma.eleve.update({
      where: { id: eleveId },
      data: { ceinture: nouvelleCeinture, barrettes: 0 },
    }),
    prisma.promotion.create({
      data: { eleveId, ceinture: nouvelleCeinture },
    }),
  ]);

  return NextResponse.json({ eleve, promotion });
}
