import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genererMotDePasseTemporaire, hasherMotDePasse } from "@/lib/password";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action === "reset") {
    const mdpTemporaire = genererMotDePasseTemporaire();
    const hash = await hasherMotDePasse(mdpTemporaire);
    await prisma.user.update({ where: { id }, data: { password: hash, motDePasseTemporaire: true } });
    return NextResponse.json({ mdpTemporaire });
  }

  if (action === "toggle") {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    await prisma.user.update({ where: { id }, data: { actif: !user.actif } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
