-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN     "nomFamille" TEXT;

-- CreateTable
CREATE TABLE "Cotisation" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "saison" TEXT NOT NULL,
    "montantBase" DOUBLE PRECISION NOT NULL,
    "reductionRenouvellement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reductionFamille" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reductionManuelle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "nbEcheances" INTEGER NOT NULL DEFAULT 1,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cotisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Echeance" (
    "id" TEXT NOT NULL,
    "cotisationId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "dateLimite" TIMESTAMP(3) NOT NULL,
    "datePaiement" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "modePaiement" TEXT,
    "note" TEXT,

    CONSTRAINT "Echeance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cotisation_eleveId_saison_key" ON "Cotisation"("eleveId", "saison");

-- AddForeignKey
ALTER TABLE "Cotisation" ADD CONSTRAINT "Cotisation_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Echeance" ADD CONSTRAINT "Echeance_cotisationId_fkey" FOREIGN KEY ("cotisationId") REFERENCES "Cotisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
