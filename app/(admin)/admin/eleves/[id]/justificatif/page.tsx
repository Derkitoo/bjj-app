import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import JustificatifClient from "./JustificatifClient";

export default async function JustificatifPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const annee = new Date().getFullYear();

  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: {
      presences: { orderBy: { date: "desc" } },
      paiements: { where: { annee }, orderBy: { mois: "asc" } },
    },
  });

  if (!eleve) notFound();

  const presencesAnnee = eleve.presences.filter((p) => new Date(p.date).getFullYear() === annee).length;
  const paiementsPayes = eleve.paiements.filter((p) => p.statut === "PAYE");
  const totalPaye = paiementsPayes.reduce((acc, p) => acc + p.montant, 0);

  return (
    <JustificatifClient
      eleveId={id}
      nom={eleve.nom}
      prenom={eleve.prenom}
      ceinture={eleve.ceinture}
      barrettes={eleve.barrettes}
      dateNaissance={eleve.dateNaissance?.toISOString() ?? null}
      dateInscription={eleve.dateInscription.toISOString()}
      presencesAnnee={presencesAnnee}
      paiements={eleve.paiements.map((p) => ({
        id: p.id,
        mois: p.mois,
        annee: p.annee,
        montant: p.montant,
        statut: p.statut,
        date: p.date?.toISOString() ?? null,
      }))}
      totalPaye={totalPaye}
      annee={annee}
      today={new Date().toISOString()}
    />
  );
}
