import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Newspaper } from "lucide-react";

const CATEGORIES: Record<string, string> = { TECHNIQUE: "Technique", COMPETITION: "Compétition", CLUB: "Club", DIVERS: "Divers" };
const CAT_COLORS: Record<string, string> = { TECHNIQUE: "bg-blue-100 text-blue-800", COMPETITION: "bg-red-100 text-red-800", CLUB: "bg-green-100 text-green-800", DIVERS: "bg-gray-100 text-gray-700" };

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/);
  return match ? match[1] : null;
}

export default async function ActualitesElevePage() {
  const posts = await prisma.post.findMany({
    where: { publie: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Actualités</h1>

      <div className="space-y-4">
        {posts.map((post) => {
          const ytId = post.videoUrl ? getYoutubeId(post.videoUrl) : null;
          return (
            <div key={post.id} className="bg-white rounded-[12px] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[post.categorie] || "bg-gray-100"}`}>
                  {CATEGORIES[post.categorie] || post.categorie}
                </span>
                <span className="text-xs text-[#666666]">
                  {format(new Date(post.createdAt), "d MMMM yyyy", { locale: fr })}
                </span>
              </div>
              <h3 className="font-semibold text-[#1a1a1a] mb-2">{post.titre}</h3>
              <p className="text-sm text-[#666666] whitespace-pre-line">{post.contenu}</p>
              {ytId && (
                <div className="mt-3 aspect-video rounded-[8px] overflow-hidden max-w-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="text-center py-12 text-[#666666]">
            <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune actualité pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
