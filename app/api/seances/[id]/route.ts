import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const { date, type, public: pub, techniques, notes } = await req.json();

  const seance = await prisma.seanceTechnique.update({
    where: { id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      ...(type ? { type } : {}),
      ...(pub ? { public: pub } : {}),
      ...(techniques ? { techniques: JSON.stringify(techniques) } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
    },
  });

  return NextResponse.json(seance);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.seanceTechnique.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
