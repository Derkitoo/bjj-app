import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const eleveId = searchParams.get("eleveId");

  const examens = await prisma.examen.findMany({
    where: eleveId ? { eleveId } : undefined,
    include: { techniques: { orderBy: { ordre: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(examens);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { eleveId, ceintureCible, date, techniques } = await req.json();

  if (!eleveId || !ceintureCible) {
    return NextResponse.json({ error: "eleveId et ceintureCible requis" }, { status: 400 });
  }

  const examen = await prisma.examen.create({
    data: {
      eleveId,
      ceintureCible,
      date: date ? new Date(date) : null,
      techniques: {
        create: (techniques as { nom: string }[] ?? []).map((t, i) => ({
          nom: t.nom,
          ordre: i,
        })),
      },
    },
    include: { techniques: { orderBy: { ordre: "asc" } } },
  });

  return NextResponse.json(examen, { status: 201 });
}
