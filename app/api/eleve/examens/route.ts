import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ELEVE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    select: { eleveId: true },
  });

  if (!user?.eleveId) return NextResponse.json([]);

  const examens = await prisma.examen.findMany({
    where: { eleveId: user.eleveId },
    include: { techniques: { orderBy: { ordre: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(examens);
}
