import { prisma } from "@/lib/prisma";

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const JOURS_SEMAINE = [1, 2, 3, 4, 5, 6, 0];
const TYPES: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Kids", COMPETITION: "Compétition", OPEN_MAT: "Open Mat" };
const COULEURS: Record<string, string> = { GI: "bg-blue-100 text-blue-800", NO_GI: "bg-purple-100 text-purple-800", KIDS: "bg-green-100 text-green-800", COMPETITION: "bg-red-100 text-red-800", OPEN_MAT: "bg-gray-100 text-gray-700" };

export default async function PlanningElevePage() {
  const cours = await prisma.cours.findMany({
    where: { annule: false },
    orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Planning</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {JOURS_SEMAINE.map((jour) => {
          const coursDuJour = cours.filter((c) => c.jour === jour).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
          if (coursDuJour.length === 0) return null;
          return (
            <div key={jour} className="bg-white rounded-[12px] shadow-sm p-4">
              <h3 className="font-semibold text-[#1a1a1a] mb-3 pb-2 border-b border-[#e5e5e5]">{JOURS[jour]}</h3>
              <div className="space-y-2">
                {coursDuJour.map((c) => (
                  <div key={c.id} className={`rounded-[8px] p-3 text-sm ${COULEURS[c.type] || "bg-gray-100"}`}>
                    <div className="font-medium">{c.heureDebut} — {TYPES[c.type] || c.type}</div>
                    <div className="text-xs opacity-70 mt-0.5">{c.duree} minutes</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {cours.length === 0 && (
          <div className="col-span-3 text-center py-12 text-[#666666]">Aucun cours au planning</div>
        )}
      </div>
    </div>
  );
}
