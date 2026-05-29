"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import EleveWizard, { type EleveFormData, defaultEleveForm } from "@/components/EleveWizard";

export default function ModifierElevePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [initialForm, setInitialForm] = useState<EleveFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmSuppr, setConfirmSuppr] = useState(false);

  useEffect(() => {
    fetch(`/api/eleves/${id}`)
      .then((r) => r.json())
      .then((eleve) => {
        setInitialForm({
          ...defaultEleveForm,
          nom:            eleve.nom ?? "",
          prenom:         eleve.prenom ?? "",
          email:          eleve.email ?? "",
          telephone:      eleve.telephone ?? "",
          dateNaissance:  eleve.dateNaissance ? eleve.dateNaissance.split("T")[0] : "",
          categorie:      eleve.categorie ?? "ADULTES",
          ceinture:       eleve.ceinture ?? "BLANCHE",
          barrettes:      eleve.barrettes ?? 0,
          niveauSport:    eleve.niveauSport ?? "",
          objectifs:      eleve.objectifs ?? "",
          poids:          eleve.poids != null ? String(eleve.poids) : "",
          taille:         eleve.taille != null ? String(eleve.taille) : "",
          adresse:        eleve.adresse ?? "",
          ville:          eleve.ville ?? "",
          codePostal:     eleve.codePostal ?? "",
          contactUrgence: eleve.contactUrgence ?? "",
          telUrgence:     eleve.telUrgence ?? "",
          medical:        eleve.medical ?? "",
          typeAbonnement: eleve.typeAbonnement ?? "MENSUEL",
          montantMensuel: eleve.montantMensuel != null ? String(eleve.montantMensuel) : "",
          nomFamille:     eleve.nomFamille ?? "",
          notes:          eleve.notes ?? "",
          actif:          eleve.actif ?? true,
        });
      });
  }, [id]);

  const handleSubmit = async (form: EleveFormData) => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/eleves/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Une erreur est survenue");
      setLoading(false);
      return;
    }
    router.push(`/admin/eleves/${id}`);
  };

  const archiver = async () => {
    await fetch(`/api/eleves/${id}`, { method: "DELETE" });
    router.push("/admin/eleves");
  };

  if (!initialForm) {
    return <div className="text-sm text-[#666666]">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/eleves/${id}`} className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Modifier l&apos;élève</h1>
      </div>

      <EleveWizard
        initialForm={initialForm}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        submitLabel="Enregistrer"
      />

      <div className="max-w-xl mt-2 pb-6">
        {!confirmSuppr ? (
          <button
            onClick={() => setConfirmSuppr(true)}
            className="flex items-center gap-2 text-sm text-[#aaaaaa] hover:text-[#ef4444] transition-colors"
          >
            <Trash2 size={14} />
            Désactiver l&apos;élève
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 flex items-center gap-4">
            <p className="text-sm text-red-700 flex-1">
              Désactiver {initialForm.prenom} {initialForm.nom} ?
            </p>
            <div className="flex gap-2">
              <button onClick={archiver}
                className="bg-[#ef4444] text-white rounded-[8px] px-3 py-1.5 text-sm font-medium hover:bg-[#dc2626] transition-colors">
                Confirmer
              </button>
              <button onClick={() => setConfirmSuppr(false)}
                className="text-sm text-[#666666] hover:text-[#1a1a1a]">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
