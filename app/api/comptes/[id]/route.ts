import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genererMotDePasseTemporaire, hasherMotDePasse, verifierMotDePasse } from "@/lib/password";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;
  const currentUserId = (session.user as { id: string }).id;

  if (action === "reset") {
    const mdpTemporaire = genererMotDePasseTemporaire();
    const hash = await hasherMotDePasse(mdpTemporaire);
    await prisma.user.update({ where: { id }, data: { password: hash, motDePasseTemporaire: true } });
    return NextResponse.json({ mdpTemporaire });
  }

  if (action === "toggle") {
    if (id === currentUserId) {
      return NextResponse.json({ error: "Impossible de désactiver son propre compte" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    await prisma.user.update({ where: { id }, data: { actif: !user.actif } });
    return NextResponse.json({ success: true });
  }

  if (action === "setPassword") {
    if (id !== currentUserId) {
      return NextResponse.json({ error: "Vous ne pouvez changer que votre propre mot de passe" }, { status: 403 });
    }
    const { ancienMdp, nouveauMdp } = body;
    if (!ancienMdp || !nouveauMdp) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }
    if (nouveauMdp.length < 8) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 8 caractères" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    const valide = await verifierMotDePasse(ancienMdp, user.password);
    if (!valide) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
    const hash = await hasherMotDePasse(nouveauMdp);
    await prisma.user.update({ where: { id }, data: { password: hash, motDePasseTemporaire: false } });
    return NextResponse.json({ success: true });
  }

  if (action === "changeRole") {
    if (id === currentUserId) {
      return NextResponse.json({ error: "Impossible de changer son propre rôle" }, { status: 400 });
    }
    const { role } = body;
    if (!["ADMIN", "PROF", "ELEVE"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    await prisma.user.update({ where: { id }, data: { role } });
    return NextResponse.json({ success: true });
  }

  if (action === "changeEmail") {
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    await prisma.user.update({ where: { id }, data: { email } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
