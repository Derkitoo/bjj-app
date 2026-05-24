"use client";

import { useState, useEffect } from "react";
import { QrCode, CheckCircle, Calendar } from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface ProfilData {
  nom: string;
  prenom: string;
  ceinture: string;
  totalPresences: number;
}

function AccueilContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null);
  const [scanMessage, setScanMessage] = useState("");

  useEffect(() => {
    fetch("/api/eleve/profil").then((r) => r.json()).then(setProfil).catch(() => {});
  }, []);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) handleScan(token);
  }, [searchParams]);

  const handleScan = async (token: string) => {
    setScanning(true);
    const res = await fetch("/api/presences/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (res.ok) {
      setScanResult("success");
      setScanMessage("Présence enregistrée !");
    } else {
      setScanResult("error");
      setScanMessage(data.error || "Erreur lors du scan");
    }
    setScanning(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Bonjour {profil?.prenom || ""}</h1>

      {profil && (
        <div className="bg-white rounded-[12px] shadow-sm p-5 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-bold">
            {profil.prenom[0]}{profil.nom[0]}
          </div>
          <div>
            <p className="font-semibold text-[#1a1a1a]">{profil.prenom} {profil.nom}</p>
            <CeintureBadge ceinture={profil.ceinture} size="sm" />
            <p className="text-xs text-[#666666] mt-1">{profil.totalPresences} cours au total</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[12px] shadow-sm p-6 mb-4 text-center">
        <QrCode size={40} className="mx-auto mb-3 text-[var(--color-primary)]" />
        <h2 className="font-semibold text-[#1a1a1a] mb-2">Pointer ma présence</h2>
        <p className="text-sm text-[#666666] mb-4">Scannez le QR Code affiché par votre professeur</p>

        {scanResult === "success" && (
          <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-[8px] p-3 mb-3">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">{scanMessage}</span>
          </div>
        )}
        {scanResult === "error" && (
          <div className="text-[#ef4444] bg-red-50 rounded-[8px] p-3 mb-3 text-sm">{scanMessage}</div>
        )}

        <p className="text-xs text-[#666666]">Le scan se fait automatiquement lorsque vous ouvrez le lien QR</p>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm p-5">
        <div className="flex items-center gap-2 text-[#1a1a1a] font-semibold mb-3">
          <Calendar size={18} className="text-[var(--color-primary)]" />
          Planning de la semaine
        </div>
        <a href="/eleve/planning" className="text-sm text-[var(--color-primary)] hover:underline">Voir le planning complet →</a>
      </div>
    </div>
  );
}

export default function AccueilPage() {
  return (
    <Suspense>
      <AccueilContent />
    </Suspense>
  );
}
