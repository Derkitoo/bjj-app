import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token requis" }, { status: 400 });

  let payload: { coursId: string; expires: number };
  try {
    payload = JSON.parse(Buffer.from(token, "base64").toString());
  } catch {
    return NextResponse.json({ error: "Token invalide" }, { status: 400 });
  }

  if (Date.now() > payload.expires) {
    return NextResponse.json({ error: "QR Code expiré" }, { status: 400 });
  }

  const eleveId = (session.user as { eleveId?: string }).eleveId;
  if (!eleveId) return NextResponse.json({ error: "Élève non trouvé" }, { status: 400 });

  const presence = await prisma.presence.upsert({
    where: { eleveId_coursId: { eleveId, coursId: payload.coursId } },
    create: { eleveId, coursId: payload.coursId },
    update: {},
  });

  return NextResponse.json({ success: true, presence });
}
