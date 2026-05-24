import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { eleveId, delta } = await req.json();
  if (!eleveId || delta === undefined) {
    return NextResponse.json({ error: "eleveId et delta requis" }, { status: 400 });
  }

  const eleve = await prisma.eleve.findUnique({ where: { id: eleveId }, select: { barrettes: true } });
  if (!eleve) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const newVal = Math.min(4, Math.max(0, eleve.barrettes + delta));
  const updated = await prisma.eleve.update({
    where: { id: eleveId },
    data: { barrettes: newVal },
  });

  return NextResponse.json({ barrettes: updated.barrettes });
}
