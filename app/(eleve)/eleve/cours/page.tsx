import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen } from "lucide-react";

const TYPES: Record<string, string> = {
  GI: "Gi", NO_GI: "No-Gi", KIDS: "Enfants", COMPETITION: "Compétition", OPEN_MAT: "Open Mat",
};
const TYPE_COLORS: Record<string, string> = {
  GI: "bg-blue-100 text-blue-700", NO_GI: "bg-purple-100 text-purple-700",
  KIDS: "bg-green-100 text-green-700", COMPETITION: "bg-red-100 text-red-700",
  OPEN_MAT: "bg-gray-100 text-gray-600",
};

function getSaisonActuelle(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export default async function CoursElevePage() {
  const saison = getSaisonActuelle();
  const [y1, y2] = saison.split("-").map(Number);

  const seances = await prisma.seanceTechnique.findMany({
    where: { date: { gte: new Date(y1, 8, 1), lte: new Date(y2, 7, 31) } },
    orderBy: { date: "desc" },
  });

  const totalTechniques = seances.reduce((acc, s) => {
    try { return acc + (JSON.parse(s.techniques) as string[]).length; } catch { return acc; }
  }, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 flex items-center gap-2">
        <BookOpen size={22} className="text-[#cc0000]" />
        Techniques du cours
      </h1>
      <p className="text-sm text-[#999999] mb-6">Saison {saison}</p>

      {seances.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Séances</p>
            <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{seances.length}</p>
          </div>
          <div className="bg-white rounded-[12px] shadow-sm p-4">
            <p className="text-xs text-[#666666]">Techniques vues</p>
            <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{totalTechniques}</p>
          </div>
        </div>
      )}

      {seances.length === 0 ? (
        <div className="bg-white rounded-[12px] shadow-sm p-12 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-[#e5e5e5]" />
          <p className="text-sm text-[#666666]">Aucune séance enregistrée pour cette saison.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seances.map((s) => {
            const techs = JSON.parse(s.techniques) as string[];
            return (
              <div key={s.id} className="bg-white rounded-[12px] shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1a1a1a]">
                      {format(new Date(s.date), "EEEE d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[s.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {TYPES[s.type] ?? s.type}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {techs.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1a1a1a]">
                      <span className="w-5 h-5 rounded-full bg-[#fff0f0] text-[#cc0000] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                {s.notes && (
                  <p className="text-xs text-[#666666] mt-3 pt-3 border-t border-[#f5f5f5] italic">
                    {s.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
