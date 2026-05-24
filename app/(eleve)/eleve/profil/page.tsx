import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CeintureBadge from "@/components/CeintureBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function ProfilElevePage() {
  const session = await auth();
  const eleveId = (session?.user as { eleveId?: string })?.eleveId;

  if (!eleveId) redirect("/login");

  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: {
      presences: { orderBy: { date: "desc" }, take: 10 },
      promotions: { orderBy: { date: "desc" } },
    },
  });

  if (!eleve) redirect("/login");

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const presencesMois = eleve.presences.filter((p) => new Date(p.date) >= startOfMonth).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Mon profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-[#cc0000] flex items-center justify-center text-white text-2xl font-bold">
              {eleve.prenom[0]}{eleve.nom[0]}
            </div>
            <div>
              <p className="text-lg font-bold text-[#1a1a1a]">{eleve.prenom} {eleve.nom}</p>
              <CeintureBadge ceinture={eleve.ceinture} />
            </div>
          </div>

          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-[#666666]">Membre depuis</dt>
              <dd className="text-sm text-[#1a1a1a] mt-0.5">
                {format(new Date(eleve.dateInscription), "MMMM yyyy", { locale: fr })}
              </dd>
            </div>
            {eleve.email && (
              <div>
                <dt className="text-xs text-[#666666]">Email</dt>
                <dd className="text-sm text-[#1a1a1a] mt-0.5">{eleve.email}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Statistiques</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#f9f9f9] rounded-[8px] p-3 text-center">
              <p className="text-2xl font-bold text-[#cc0000]">{eleve.presences.length}</p>
              <p className="text-xs text-[#666666] mt-1">Cours au total</p>
            </div>
            <div className="bg-[#f9f9f9] rounded-[8px] p-3 text-center">
              <p className="text-2xl font-bold text-[#cc0000]">{presencesMois}</p>
              <p className="text-xs text-[#666666] mt-1">Ce mois-ci</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Historique des promotions</h2>
          {eleve.promotions.length > 0 ? (
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <CeintureBadge ceinture={eleve.ceinture} size="sm" />
                <span className="text-xs text-[#666666]">Actuelle</span>
              </li>
              {eleve.promotions.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <CeintureBadge ceinture={p.ceinture} size="sm" />
                  <span className="text-xs text-[#666666]">
                    {format(new Date(p.date), "d MMMM yyyy", { locale: fr })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#666666]">Aucune promotion enregistrée</p>
          )}
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Dernières présences</h2>
          {eleve.presences.length > 0 ? (
            <ul className="space-y-2">
              {eleve.presences.slice(0, 8).map((p) => (
                <li key={p.id} className="text-sm text-[#666666]">
                  {format(new Date(p.date), "d MMMM yyyy", { locale: fr })}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#666666]">Aucune présence enregistrée</p>
          )}
        </div>
      </div>
    </div>
  );
}
