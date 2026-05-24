import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { publie: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { titre, contenu, videoUrl, categorie } = await req.json();

  if (!titre || !contenu) {
    return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      titre,
      contenu,
      videoUrl: videoUrl || null,
      categorie,
      publie: true,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
