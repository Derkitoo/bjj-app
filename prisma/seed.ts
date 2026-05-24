import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bjj.fr" },
    update: {},
    create: { email: "admin@bjj.fr", password: adminPassword, role: "ADMIN" },
  });

  const elevesData = [
    { nom: "Martin", prenom: "Lucas", email: "lucas@bjj.fr", ceinture: "BLEUE" as const },
    { nom: "Dubois", prenom: "Emma", email: "emma@bjj.fr", ceinture: "VIOLETTE" as const },
    { nom: "Bernard", prenom: "Noah", email: "noah@bjj.fr", ceinture: "BLANCHE" as const },
    { nom: "Petit", prenom: "Léa", email: "lea@bjj.fr", ceinture: "BLEUE" as const },
    { nom: "Robert", prenom: "Hugo", email: "hugo@bjj.fr", ceinture: "MARRON" as const },
  ];

  const eleves = [];
  for (const data of elevesData) {
    const motDePasse = await bcrypt.hash("eleve123", 12);
    const eleve = await prisma.eleve.upsert({
      where: { id: data.email },
      update: {},
      create: {
        id: data.email,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        ceinture: data.ceinture,
        dateInscription: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 2),
      },
    });

    await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: { email: data.email, password: motDePasse, role: "ELEVE", eleveId: eleve.id },
    });

    eleves.push(eleve);
  }

  const coursData = [
    { type: "GI" as const, jour: 1, heureDebut: "19:00", duree: 90, recurrent: true },
    { type: "NO_GI" as const, jour: 3, heureDebut: "19:30", duree: 90, recurrent: true },
    { type: "GI" as const, jour: 5, heureDebut: "18:00", duree: 90, recurrent: true },
    { type: "KIDS" as const, jour: 6, heureDebut: "10:00", duree: 60, recurrent: true },
    { type: "OPEN_MAT" as const, jour: 6, heureDebut: "11:30", duree: 90, recurrent: true },
  ];

  const cours = [];
  for (const data of coursData) {
    const c = await prisma.cours.create({ data });
    cours.push(c);
  }

  for (const eleve of eleves) {
    const nbPresences = Math.floor(Math.random() * 30) + 10;
    for (let i = 0; i < Math.min(nbPresences, cours.length * 3); i++) {
      const coursChoisi = cours[i % cours.length];
      try {
        await prisma.presence.create({
          data: {
            eleveId: eleve.id,
            coursId: coursChoisi.id,
            date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
          },
        });
      } catch {}
    }
  }

  await prisma.criterePromotion.upsert({
    where: { ceintureCible: "BLEUE" },
    update: {},
    create: { ceintureCible: "BLEUE", minCours: 30, minMois: 6 },
  });
  await prisma.criterePromotion.upsert({
    where: { ceintureCible: "VIOLETTE" },
    update: {},
    create: { ceintureCible: "VIOLETTE", minCours: 60, minMois: 12 },
  });
  await prisma.criterePromotion.upsert({
    where: { ceintureCible: "MARRON" },
    update: {},
    create: { ceintureCible: "MARRON", minCours: 120, minMois: 18 },
  });
  await prisma.criterePromotion.upsert({
    where: { ceintureCible: "NOIRE" },
    update: {},
    create: { ceintureCible: "NOIRE", minCours: 200, minMois: 36 },
  });

  const postCount = await prisma.post.count();
  if (postCount === 0) {
    await prisma.post.createMany({
      data: [
        { titre: "Bienvenue sur BJJ Manager !", contenu: "Notre nouveau système de gestion est en ligne. Vous pouvez désormais suivre vos présences et votre progression en ligne.", categorie: "CLUB" },
        { titre: "Technique du mois : La garde fermée", contenu: "Ce mois-ci nous travaillons les sorties de garde fermée. Voici une vidéo de référence pour réviser à la maison.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", categorie: "TECHNIQUE" },
        { titre: "Tournoi régional — Inscriptions ouvertes", contenu: "Le tournoi régional aura lieu le mois prochain. Les inscriptions sont ouvertes. Parlez-en à votre professeur pour plus d'informations.", categorie: "COMPETITION" },
      ],
    });
  }

  console.log("Seed terminé avec succès");
  console.log("Admin : admin@bjj.fr / admin123");
  console.log("Élève exemple : lucas@bjj.fr / eleve123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
