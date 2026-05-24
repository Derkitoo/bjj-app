"use client";

import { useState, useEffect } from "react";
import { Plus, X, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Post {
  id: string;
  titre: string;
  contenu: string;
  videoUrl: string | null;
  categorie: string;
  publie: boolean;
  createdAt: string;
}

const CATEGORIES: Record<string, string> = { TECHNIQUE: "Technique", COMPETITION: "Compétition", CLUB: "Club", DIVERS: "Divers" };
const CAT_COLORS: Record<string, string> = { TECHNIQUE: "bg-blue-100 text-blue-800", COMPETITION: "bg-red-100 text-red-800", CLUB: "bg-green-100 text-green-800", DIVERS: "bg-gray-100 text-gray-700" };

export default function ActualitesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titre: "", contenu: "", videoUrl: "", categorie: "TECHNIQUE" });

  useEffect(() => {
    fetch("/api/posts").then((r) => r.json()).then(setPosts);
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setPosts((prev) => [data, ...prev]);
    setShowForm(false);
    setForm({ titre: "", contenu: "", videoUrl: "", categorie: "TECHNIQUE" });
  };

  const supprimer = async (id: string) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Actualités</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#cc0000] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[#aa0000] transition-colors"
        >
          <Plus size={16} />
          Nouveau post
        </button>
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const ytId = post.videoUrl ? getYoutubeId(post.videoUrl) : null;
          return (
            <div key={post.id} className="bg-white rounded-[12px] shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
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
                <button onClick={() => supprimer(post.id)} className="text-[#666666] hover:text-[#ef4444] transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="text-center py-12 text-[#666666]">
            <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune actualité publiée</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-[12px] p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1a1a1a]">Nouveau post</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={creer} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Titre *</label>
                <input required value={form.titre} onChange={set("titre")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Catégorie</label>
                <select value={form.categorie} onChange={set("categorie")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]">
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Contenu *</label>
                <textarea required value={form.contenu} onChange={set("contenu")} rows={4} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Lien YouTube (optionnel)</label>
                <input value={form.videoUrl} onChange={set("videoUrl")} placeholder="https://youtube.com/watch?v=..." className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
              </div>
              <button type="submit" className="w-full bg-[#cc0000] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[#aa0000] transition-colors">
                Publier
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
