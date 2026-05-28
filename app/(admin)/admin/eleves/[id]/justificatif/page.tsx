import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import JustificatifClient from "./JustificatifClient";

function getSaisonActuelle(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export default async function JustificatifPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const saison = getSaisonActuelle();
  const annee = new Date().getFullYear();

  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: {
      presences: { where: { date: { gte: new Date(annee, 0, 1) } } },
      cotisations: {
        where: { saison },
        include: { echeances: { orderBy: { numero: "asc" } } },
        take: 1,
      },
    },
  });

  if (!eleve) notFound();

  const cotisation = eleve.cotisations[0] ?? null;

  return (
    <JustificatifClient
      eleveId={id}
      nom={eleve.nom}
      prenom={eleve.prenom}
      ceinture={eleve.ceinture}
      barrettes={eleve.barrettes}
      dateNaissance={eleve.dateNaissance?.toISOString() ?? null}
      dateInscription={eleve.dateInscription.toISOString()}
      presencesAnnee={eleve.presences.length}
      saison={saison}
      cotisation={cotisation ? {
        saison: cotisation.saison,
        montantBase: cotisation.montantBase,
        reductionRenouvellement: cotisation.reductionRenouvellement,
        reductionFamille: cotisation.reductionFamille,
        reductionManuelle: cotisation.reductionManuelle,
        montantTotal: cotisation.montantTotal,
        nbEcheances: cotisation.nbEcheances,
        statut: cotisation.statut,
        echeances: cotisation.echeances.map((e) => ({
          id: e.id,
          numero: e.numero,
          montant: e.montant,
          dateLimite: e.dateLimite.toISOString(),
          datePaiement: e.datePaiement?.toISOString() ?? null,
          statut: e.statut,
          modePaiement: e.modePaiement ?? null,
        })),
      } : null}
      today={new Date().toISOString()}
    />
  );
}
