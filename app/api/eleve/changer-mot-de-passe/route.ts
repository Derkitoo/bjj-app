import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifierMotDePasse, hasherMotDePasse } from "@/lib/password";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ancienMdp, nouveauMdp } = await req.json();
  if (!ancienMdp || !nouveauMdp) {
    return NextResponse.json({ error: "Les deux mots de passe sont requis" }, { status: 400 });
  }

  if (nouveauMdp.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const valide = await verifierMotDePasse(ancienMdp, user.password);
  if (!valide) return NextResponse.json({ error: "Ancien mot de passe incorrect" }, { status: 400 });

  const hash = await hasherMotDePasse(nouveauMdp);
  await prisma.user.update({ where: { id: userId }, data: { password: hash, motDePasseTemporaire: false } });

  return NextResponse.json({ success: true });
}
