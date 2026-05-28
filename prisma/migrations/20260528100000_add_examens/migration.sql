CREATE TABLE "Examen" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "ceintureCible" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "notesProf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Examen_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamenTechnique" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'NON_EVALUE',
    "commentaire" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ExamenTechnique_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Examen" ADD CONSTRAINT "Examen_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamenTechnique" ADD CONSTRAINT "ExamenTechnique_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "Examen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
