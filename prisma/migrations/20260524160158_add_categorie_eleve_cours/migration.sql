-- AlterTable
ALTER TABLE "Cours" ADD COLUMN     "categorie" TEXT NOT NULL DEFAULT 'TOUS';

-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN     "categorie" TEXT NOT NULL DEFAULT 'ADULTES';
