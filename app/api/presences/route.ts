import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const coursId = searchParams.get("coursId");
  const eleveId = searchParams.get("eleveId");

  const presences = await prisma.presence.findMany({
    where: {
      coursId: coursId || undefined,
      eleveId: eleveId || undefined,
    },
    include: { cours: true, eleve: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(presences);
}
