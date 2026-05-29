import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfCurrentMonth = startOfMonth(today);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, 5 - i);
    return { label: d.toLocaleDateString("fr-FR", { month: "short" }), start: startOfMonth(d), end: endOfMonth(d) };
  });

  const [totalEleves, presencesAujourdhui, lastPost, criteres, eleves, paiementsImpayesCeMois] = await Promise.all([
    prisma.eleve.count({ where: { actif: true } }),
    prisma.presence.count({ where: { date: { gte: startOfDay } } }),
    prisma.post.findFirst({ where: { publie: true }, orderBy: { createdAt: "desc" } }),
    prisma.criterePromotion.findMany(),
    prisma.eleve.findMany({
      where: { actif: true },
      include: {
        presences: { where: { date: { gte: startOfCurrentMonth } } },
        promotions: { orderBy: { date: "desc" }, take: 1 },
      },
    }),
    prisma.paiement.count({
      where: { statut: { not: "PAYE" }, mois: today.getMonth() + 1, annee: today.getFullYear() },
    }),
  ]);

  const presencesParMois = await Promise.all(
    months.map((m) => prisma.presence.count({ where: { date: { gte: m.start, lte: m.end } } }))
  );

  const allEleves = await prisma.eleve.findMany({ where: { actif: true }, select: { ceinture: true } });
  const distribCeinture: Record<string, number> = {};
  allEleves.forEach((e) => { distribCeinture[e.ceinture] = (distribCeinture[e.ceinture] ?? 0) + 1; });

  const presencesMois = await prisma.presence.count({ where: { date: { gte: startOfCurrentMonth } } });
  const tauxPresence = totalEleves > 0 ? Math.round((presencesMois / (totalEleves * 4)) * 100) : 0;
  const nbFideles = eleves.filter((e) => e.presences.length >= 3).length;

  const NEXT: Record<string, string> = { BLANCHE: "BLEUE", BLEUE: "VIOLETTE", VIOLETTE: "MARRON", MARRON: "NOIRE" };
  const eligibles = eleves
    .filter((e) => {
      const nextBelt = NEXT[e.ceinture];
      if (!nextBelt) return false;
      const critere = criteres.find((c) => c.ceintureCible === nextBelt);
      if (!critere) return false;
      const lastPromo = e.promotions[0];
      const monthsSince = lastPromo
        ? (today.getTime() - new Date(lastPromo.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
        : 999;
      return e.presences.length >= critere.minCours && monthsSince >= critere.minMois;
    })
    .map((e) => ({ id: e.id, prenom: e.prenom, nom: e.nom, ceinture: e.ceinture, nextBelt: NEXT[e.ceinture] }));

  const top5 = [...eleves]
    .sort((a, b) => b.presences.length - a.presences.length)
    .slice(0, 5)
    .filter((e) => e.presences.length > 0)
    .map((e) => ({ id: e.id, prenom: e.prenom, nom: e.nom, count: e.presences.length }));

  return NextResponse.json({
    kpis: { totalEleves, presencesAujourdhui, tauxPresence, paiementsImpayesCeMois, nbFideles, presencesMois },
    graphPresences: months.map((m, i) => ({ label: m.label, count: presencesParMois[i] })),
    distribCeinture,
    eligibles,
    top5,
    lastPost: lastPost ? { titre: lastPost.titre, contenu: lastPost.contenu, createdAt: lastPost.createdAt.toISOString() } : null,
  });
}
