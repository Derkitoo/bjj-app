import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genererMotDePasseTemporaire, hasherMotDePasse } from "@/lib/password";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const comptes = await prisma.user.findMany({
    include: { eleve: { select: { nom: true, prenom: true, ceinture: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comptes.map((c) => ({ ...c, password: undefined })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { email, role } = body;

  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });

  if (role === "ADMIN" || role === "PROF") {
    const { password } = body;
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Mot de passe requis (8 caractères minimum)" }, { status: 400 });
    }
    const hash = await hasherMotDePasse(password);
    const user = await prisma.user.create({
      data: { email, password: hash, role, motDePasseTemporaire: false },
    });
    return NextResponse.json({ userId: user.id }, { status: 201 });
  }

  const { eleveId } = body;
  if (!eleveId) return NextResponse.json({ error: "eleveId requis pour un compte élève" }, { status: 400 });

  const mdpTemporaire = genererMotDePasseTemporaire();
  const hash = await hasherMotDePasse(mdpTemporaire);
  const user = await prisma.user.create({
    data: { email, password: hash, role: "ELEVE", eleveId, motDePasseTemporaire: true },
  });

  return NextResponse.json({ userId: user.id, mdpTemporaire }, { status: 201 });
}
