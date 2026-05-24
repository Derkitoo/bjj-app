import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { eleveId, coursId, retirer } = await req.json();

  if (!eleveId || !coursId) {
    return NextResponse.json({ error: "eleveId et coursId requis" }, { status: 400 });
  }

  if (retirer) {
    await prisma.presence.deleteMany({ where: { eleveId, coursId } });
    return NextResponse.json({ success: true, action: "retiré" });
  }

  const presence = await prisma.presence.upsert({
    where: { eleveId_coursId: { eleveId, coursId } },
    create: { eleveId, coursId },
    update: {},
  });

  return NextResponse.json(presence);
}
