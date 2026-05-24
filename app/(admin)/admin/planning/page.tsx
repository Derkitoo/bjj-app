"use client";

import { useState, useEffect } from "react";
import { Plus, X, Pencil } from "lucide-react";

interface Cours {
  id: string;
  type: string;
  jour: number;
  heureDebut: string;
  duree: number;
  titre: string | null;
  recurrent: boolean;
  annule: boolean;
}

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const JOURS_SEMAINE = [1, 2, 3, 4, 5, 6, 0];
const TYPES: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Kids", COMPETITION: "Compétition", OPEN_MAT: "Open Mat" };
const COULEURS: Record<string, string> = { GI: "bg-blue-100 text-blue-800", NO_GI: "bg-purple-100 text-purple-800", KIDS: "bg-green-100 text-green-800", COMPETITION: "bg-red-100 text-red-800", OPEN_MAT: "bg-gray-100 text-gray-700" };

export default function PlanningPage() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "GI", jour: 1, heureDebut: "19:00", duree: 90, titre: "", recurrent: true });

  useEffect(() => {
    fetch("/api/cours").then((r) => r.json()).then(setCours);
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: field === "jour" || field === "duree" ? Number(e.target.value) : field === "recurrent" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/cours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCours((prev) => [...prev, data]);
    setShowForm(false);
    setForm({ type: "GI", jour: 1, heureDebut: "19:00", duree: 90, titre: "", recurrent: true });
  };

  const annuler = async (id: string) => {
    await fetch(`/api/cours/${id}`, { method: "DELETE" });
    setCours((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Planning</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#cc0000] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[#aa0000] transition-colors"
        >
          <Plus size={16} />
          Ajouter un cours
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {JOURS_SEMAINE.map((jour) => {
          const coursDuJour = cours.filter((c) => c.jour === jour && !c.annule).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
          return (
            <div key={jour} className="bg-white rounded-[12px] shadow-sm p-3">
              <h3 className="font-semibold text-sm text-[#1a1a1a] mb-3 pb-2 border-b border-[#e5e5e5]">{JOURS[jour]}</h3>
              <div className="space-y-2">
                {coursDuJour.map((c) => (
                  <div key={c.id} className={`rounded-[8px] p-2 text-xs ${COULEURS[c.type] || "bg-gray-100"}`}>
                    <div className="font-medium">{c.heureDebut}</div>
                    <div>{TYPES[c.type] || c.type}</div>
                    <div className="text-[10px] opacity-70">{c.duree} min{c.recurrent ? " · récurrent" : ""}</div>
                    <button onClick={() => annuler(c.id)} className="mt-1 text-[10px] underline opacity-60 hover:opacity-100">Supprimer</button>
                  </div>
                ))}
                {coursDuJour.length === 0 && <p className="text-xs text-[#666666] text-center py-2">—</p>}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-[12px] p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1a1a1a]">Nouveau cours</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={creer} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Type</label>
                <select value={form.type} onChange={set("type")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]">
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Jour</label>
                <select value={form.jour} onChange={set("jour")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]">
                  {JOURS.map((j, i) => <option key={i} value={i}>{j}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Heure</label>
                  <input type="time" value={form.heureDebut} onChange={set("heureDebut")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Durée (min)</label>
                  <input type="number" value={form.duree} onChange={set("duree")} className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="recurrent" checked={form.recurrent} onChange={set("recurrent")} className="accent-[#cc0000]" />
                <label htmlFor="recurrent" className="text-sm text-[#1a1a1a]">Cours récurrent</label>
              </div>
              <button type="submit" className="w-full bg-[#cc0000] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[#aa0000] transition-colors mt-2">
                Créer le cours
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
