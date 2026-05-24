import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@bjj.fr" },
    update: {},
    create: {
      email: "admin@bjj.fr",
      password: adminPassword,
      role: "ADMIN",
      motDePasseTemporaire: false,
    },
  });

  await prisma.criterePromotion.upsert({
    where: { ceintureCible: "BLEUE" },
    update: {},
    create: { ceintureCible: "BLEUE", minCours: 30, minMois: 6, description: "30 cours minimum, 6 mois de pratique" },
  });
  await prisma.criterePromotion.upsert({
    where: { ceintureCible: "VIOLETTE" },
    update: {},
    create: { ceintureCible: "VIOLETTE", minCours: 60, minMois: 12, description: "60 cours minimum, 12 mois de pratique" },
  });
  await prisma.criterePromotion.upsert({
    where: { ceintureCible: "MARRON" },
    update: {},
    create: { ceintureCible: "MARRON", minCours: 120, minMois: 18, description: "120 cours minimum, 18 mois de pratique" },
  });
  await prisma.criterePromotion.upsert({
    where: { ceintureCible: "NOIRE" },
    update: {},
    create: { ceintureCible: "NOIRE", minCours: 200, minMois: 36, description: "200 cours minimum, 3 ans de pratique" },
  });

  console.log("Seed V2 terminé");
  console.log("Admin : admin@bjj.fr / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
