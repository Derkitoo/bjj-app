-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN     "montantMensuel" DOUBLE PRECISION,
ADD COLUMN     "typeAbonnement" TEXT NOT NULL DEFAULT 'MENSUEL';
