-- Drop old exam tables
DROP TABLE IF EXISTS "ExamenTechnique" CASCADE;
DROP TABLE IF EXISTS "Examen" CASCADE;

-- ExamenSession
CREATE TABLE "ExamenSession" (
  "id"            TEXT NOT NULL,
  "date"          TIMESTAMP(3) NOT NULL,
  "ceintureCible" TEXT NOT NULL,
  "section"       TEXT NOT NULL DEFAULT 'GI',
  "notes"         TEXT,
  "statut"        TEXT NOT NULL DEFAULT 'PLANIFIE',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamenSession_pkey" PRIMARY KEY ("id")
);

-- ExamenCritere
CREATE TABLE "ExamenCritere" (
  "id"        TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "nom"       TEXT NOT NULL,
  "ordre"     INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ExamenCritere_pkey" PRIMARY KEY ("id")
);

-- ExamenParticipant
CREATE TABLE "ExamenParticipant" (
  "id"        TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "eleveId"   TEXT NOT NULL,
  "resultat"  TEXT,
  "notesProf" TEXT,
  CONSTRAINT "ExamenParticipant_pkey" PRIMARY KEY ("id")
);

-- ExamenEvaluation
CREATE TABLE "ExamenEvaluation" (
  "id"            TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "critereId"     TEXT NOT NULL,
  "statut"        TEXT NOT NULL DEFAULT 'NON_EVALUE',
  CONSTRAINT "ExamenEvaluation_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "ExamenCritere"    ADD CONSTRAINT "ExamenCritere_sessionId_fkey"      FOREIGN KEY ("sessionId")     REFERENCES "ExamenSession"("id")     ON DELETE CASCADE;
ALTER TABLE "ExamenParticipant" ADD CONSTRAINT "ExamenParticipant_sessionId_fkey"  FOREIGN KEY ("sessionId")     REFERENCES "ExamenSession"("id")     ON DELETE CASCADE;
ALTER TABLE "ExamenParticipant" ADD CONSTRAINT "ExamenParticipant_eleveId_fkey"    FOREIGN KEY ("eleveId")       REFERENCES "Eleve"("id")             ON DELETE CASCADE;
ALTER TABLE "ExamenEvaluation"  ADD CONSTRAINT "ExamenEvaluation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ExamenParticipant"("id") ON DELETE CASCADE;
ALTER TABLE "ExamenEvaluation"  ADD CONSTRAINT "ExamenEvaluation_critereId_fkey"   FOREIGN KEY ("critereId")     REFERENCES "ExamenCritere"("id")     ON DELETE CASCADE;
