-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "codePostal" TEXT,
ADD COLUMN     "contactUrgence" TEXT,
ADD COLUMN     "medical" TEXT,
ADD COLUMN     "niveauSport" TEXT,
ADD COLUMN     "objectifs" TEXT,
ADD COLUMN     "poids" DOUBLE PRECISION,
ADD COLUMN     "taille" DOUBLE PRECISION,
ADD COLUMN     "telUrgence" TEXT,
ADD COLUMN     "ville" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "derniereConnexion" TIMESTAMP(3),
ADD COLUMN     "motDePasseTemporaire" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_eleveId_mois_annee_key" ON "Paiement"("eleveId", "mois", "annee");

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
