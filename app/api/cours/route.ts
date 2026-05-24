import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const cours = await prisma.cours.findMany({
    where: { annule: false },
    orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
  });

  return NextResponse.json(cours);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { type, jour, heureDebut, duree, titre, recurrent, categorie } = body;

  const cours = await prisma.cours.create({
    data: {
      type,
      jour: Number(jour),
      heureDebut,
      duree: Number(duree),
      titre: titre || null,
      recurrent: Boolean(recurrent),
      categorie: categorie || "TOUS",
    },
  });

  return NextResponse.json(cours, { status: 201 });
}
