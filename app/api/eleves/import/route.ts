import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genererMotDePasseTemporaire, hasherMotDePasse } from "@/lib/password";

interface EleveImport {
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  dateNaissance?: string;
  ceinture?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { eleves }: { eleves: EleveImport[] } = await req.json();
  if (!Array.isArray(eleves) || eleves.length === 0) {
    return NextResponse.json({ error: "Aucun élève à importer" }, { status: 400 });
  }

  const results: { ok: number; skipped: number; errors: string[] } = { ok: 0, skipped: 0, errors: [] };

  for (const row of eleves) {
    if (!row.prenom?.trim() || !row.nom?.trim()) {
      results.errors.push(`Ligne ignorée : prénom/nom manquant (${JSON.stringify(row)})`);
      results.skipped++;
      continue;
    }

    try {
      if (row.email) {
        const existing = await prisma.user.findUnique({ where: { email: row.email } });
        if (existing) {
          results.errors.push(`Email déjà utilisé : ${row.email}`);
          results.skipped++;
          continue;
        }
      }

      const CEINTURES_VALIDES = ["BLANCHE", "BLEUE", "VIOLETTE", "MARRON", "NOIRE"];
      const ceinture = row.ceinture?.toUpperCase();
      const ceintureFinale = CEINTURES_VALIDES.includes(ceinture ?? "") ? (ceinture as string) : "BLANCHE";

      const eleve = await prisma.eleve.create({
        data: {
          prenom: row.prenom.trim(),
          nom: row.nom.trim(),
          email: row.email?.trim() || null,
          telephone: row.telephone?.trim() || null,
          dateNaissance: row.dateNaissance ? new Date(row.dateNaissance) : null,
          ceinture: ceintureFinale,
        },
      });

      if (row.email?.trim()) {
        const mdp = genererMotDePasseTemporaire();
        const hash = await hasherMotDePasse(mdp);
        await prisma.user.create({
          data: { email: row.email.trim(), password: hash, role: "ELEVE", eleveId: eleve.id, motDePasseTemporaire: true },
        });
      }

      results.ok++;
    } catch {
      results.errors.push(`Erreur pour ${row.prenom} ${row.nom}`);
      results.skipped++;
    }
  }

  return NextResponse.json(results, { status: 201 });
}
