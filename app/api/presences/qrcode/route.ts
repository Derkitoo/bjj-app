import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { coursId } = await req.json();
  if (!coursId) return NextResponse.json({ error: "coursId requis" }, { status: 400 });

  const expires = Date.now() + 90 * 60 * 1000;
  const token = Buffer.from(JSON.stringify({ coursId, expires })).toString("base64");
  const url = `${process.env.NEXTAUTH_URL}/eleve/accueil?token=${token}`;

  const qrDataUrl = await QRCode.toDataURL(url, { width: 300 });

  return NextResponse.json({ qrDataUrl, token, expires });
}
