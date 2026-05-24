import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const criteres = await prisma.criterePromotion.findMany({ orderBy: { ceintureCible: "asc" } });
  return NextResponse.json(criteres);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body: { ceintureCible: string; minCours: number; minMois: number; description?: string }[] = await req.json();

  await Promise.all(
    body.map((c) =>
      prisma.criterePromotion.upsert({
        where: { ceintureCible: c.ceintureCible },
        update: { minCours: c.minCours, minMois: c.minMois, description: c.description ?? null },
        create: { ceintureCible: c.ceintureCible, minCours: c.minCours, minMois: c.minMois, description: c.description ?? null },
      })
    )
  );

  return NextResponse.json({ success: true });
}
