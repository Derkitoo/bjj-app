"use client";

import { useState, useEffect } from "react";
import { QrCode, Users, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  photo: string | null;
  ceinture: string;
}

interface Cours {
  id: string;
  type: string;
  heureDebut: string;
  duree: number;
  jour: number;
}

interface Presence {
  eleveId: string;
}

export default function PresencePage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [selectedCours, setSelectedCours] = useState<string>("");
  const [presences, setPresences] = useState<Set<string>>(new Set());
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [modeTablette, setModeTablette] = useState(false);

  useEffect(() => {
    fetch("/api/eleves").then((r) => r.json()).then(setEleves);
    fetch("/api/cours").then((r) => r.json()).then(setCours);
  }, []);

  useEffect(() => {
    if (!selectedCours) return;
    fetch(`/api/presences?coursId=${selectedCours}`)
      .then((r) => r.json())
      .then((data: Presence[]) => setPresences(new Set(data.map((p) => p.eleveId))));
  }, [selectedCours]);

  const genererQR = async () => {
    const res = await fetch("/api/presences/qrcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coursId: selectedCours }),
    });
    const data = await res.json();
    setQrDataUrl(data.qrDataUrl);
    setShowQR(true);
  };

  const togglePresence = async (eleveId: string) => {
    const estPresent = presences.has(eleveId);
    await fetch("/api/presences/manuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eleveId, coursId: selectedCours, retirer: estPresent }),
    });
    setPresences((prev) => {
      const next = new Set(prev);
      estPresent ? next.delete(eleveId) : next.add(eleveId);
      return next;
    });
  };

  const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const TYPES: Record<string, string> = { GI: "Gi", NO_GI: "No-Gi", KIDS: "Kids", COMPETITION: "Compétition", OPEN_MAT: "Open Mat" };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Présence</h1>

      <div className="bg-white rounded-[12px] shadow-sm p-5 mb-5">
        <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Sélectionner le cours</label>
        <select
          value={selectedCours}
          onChange={(e) => setSelectedCours(e.target.value)}
          className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]"
        >
          <option value="">-- Choisir un cours --</option>
          {cours.map((c) => (
            <option key={c.id} value={c.id}>
              {JOURS[c.jour]} — {c.heureDebut} — {TYPES[c.type] || c.type}
            </option>
          ))}
        </select>
      </div>

      {selectedCours && (
        <>
          <div className="flex flex-wrap gap-3 mb-5">
            <button
              onClick={genererQR}
              className="flex items-center gap-2 bg-[#cc0000] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[#aa0000] transition-colors"
            >
              <QrCode size={16} />
              Générer QR Code
            </button>
            <button
              onClick={() => setModeTablette(!modeTablette)}
              className="flex items-center gap-2 border border-[#cc0000] text-[#cc0000] rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[#cc0000] hover:text-white transition-colors"
            >
              <Users size={16} />
              {modeTablette ? "Mode liste" : "Mode tablette"}
            </button>
            <div className="flex items-center gap-2 text-sm text-[#666666] ml-auto">
              <CheckCircle size={16} className="text-green-500" />
              {presences.size} présent{presences.size > 1 ? "s" : ""} / {eleves.filter((e) => e.ceinture !== "INACTIF").length}
            </div>
          </div>

          {modeTablette ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {eleves.map((eleve) => {
                const present = presences.has(eleve.id);
                return (
                  <button
                    key={eleve.id}
                    onClick={() => togglePresence(eleve.id)}
                    className={`bg-white rounded-[12px] shadow-sm p-4 text-center transition-all border-2 ${
                      present ? "border-green-500 bg-green-50" : "border-transparent hover:border-[#e5e5e5]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold ${present ? "bg-green-500" : "bg-[#cc0000]"}`}>
                      {present ? "✓" : `${eleve.prenom[0]}${eleve.nom[0]}`}
                    </div>
                    <p className="text-xs font-medium text-[#1a1a1a]">{eleve.prenom}</p>
                    <p className="text-xs text-[#666666]">{eleve.nom}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Élève</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-3">Présent</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((eleve, i) => (
                    <tr key={eleve.id} className={`border-b border-[#e5e5e5] ${i % 2 === 0 ? "" : "bg-[#f9f9f9]"}`}>
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">
                        {eleve.prenom} {eleve.nom}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePresence(eleve.id)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                            presences.has(eleve.id)
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-[#e5e5e5] hover:border-green-500"
                          }`}
                        >
                          {presences.has(eleve.id) && "✓"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-[12px] p-8 text-center max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">QR Code du cours</h2>
            <p className="text-sm text-[#666666] mb-4">Valable 90 minutes</p>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="mx-auto" />}
            <button onClick={() => setShowQR(false)} className="mt-4 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm hover:bg-[#f9f9f9]">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
