import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const p  = await prisma.presence.deleteMany({});
console.log("Présences supprimées :", p.count);
const pr = await prisma.promotion.deleteMany({});
console.log("Promotions supprimées :", pr.count);
const pa = await prisma.paiement.deleteMany({});
console.log("Paiements supprimés  :", pa.count);
const u  = await prisma.user.deleteMany({ where: { role: "ELEVE" } });
console.log("Comptes élèves       :", u.count);
const e  = await prisma.eleve.deleteMany({});
console.log("Élèves supprimés     :", e.count);

await prisma.$disconnect();
