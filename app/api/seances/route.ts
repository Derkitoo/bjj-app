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
  const saison = searchParams.get("saison");
  const type = searchParams.get("type");

  let dateMin: Date | undefined;
  let dateMax: Date | undefined;
  if (saison) {
    const [y1, y2] = saison.split("-").map(Number);
    dateMin = new Date(y1, 8, 1);
    dateMax = new Date(y2, 7, 31);
  }

  const seances = await prisma.seanceTechnique.findMany({
    where: {
      ...(dateMin && dateMax ? { date: { gte: dateMin, lte: dateMax } } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(seances);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { date, type, techniques, notes } = await req.json();
  if (!date || !type || !techniques?.length) {
    return NextResponse.json({ error: "date, type et techniques requis" }, { status: 400 });
  }

  const seance = await prisma.seanceTechnique.create({
    data: {
      date: new Date(date),
      type,
      techniques: JSON.stringify(techniques),
      notes: notes || null,
    },
  });

  return NextResponse.json(seance, { status: 201 });
}
