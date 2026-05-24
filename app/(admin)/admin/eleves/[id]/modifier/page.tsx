"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

interface FormData {
  nom: string; prenom: string; email: string; telephone: string;
  dateNaissance: string; ceinture: string; barrettes: number; notes: string; actif: boolean;
  poids: string; taille: string; adresse: string; ville: string;
  codePostal: string; contactUrgence: string; telUrgence: string;
  niveauSport: string; objectifs: string; medical: string;
  montantMensuel: string; typeAbonnement: string; nomFamille: string;
}

const defaultForm: FormData = {
  nom: "", prenom: "", email: "", telephone: "", dateNaissance: "",
  ceinture: "BLANCHE", barrettes: 0, notes: "", actif: true,
  poids: "", taille: "", adresse: "", ville: "", codePostal: "",
  contactUrgence: "", telUrgence: "", niveauSport: "", objectifs: "", medical: "",
  montantMensuel: "", typeAbonnement: "MENSUEL", nomFamille: "",
};

export default function ModifierElevePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [confirmSuppr, setConfirmSuppr] = useState(false);

  useEffect(() => {
    fetch(`/api/eleves/${id}`)
      .then((r) => r.json())
      .then((eleve) => {
        setForm({
          nom: eleve.nom ?? "",
          prenom: eleve.prenom ?? "",
          email: eleve.email ?? "",
          telephone: eleve.telephone ?? "",
          dateNaissance: eleve.dateNaissance ? eleve.dateNaissance.split("T")[0] : "",
          ceinture: eleve.ceinture ?? "BLANCHE",
          barrettes: eleve.barrettes ?? 0,
          notes: eleve.notes ?? "",
          actif: eleve.actif ?? true,
          poids: eleve.poids != null ? String(eleve.poids) : "",
          taille: eleve.taille != null ? String(eleve.taille) : "",
          adresse: eleve.adresse ?? "",
          ville: eleve.ville ?? "",
          codePostal: eleve.codePostal ?? "",
          contactUrgence: eleve.contactUrgence ?? "",
          telUrgence: eleve.telUrgence ?? "",
          niveauSport: eleve.niveauSport ?? "",
          objectifs: eleve.objectifs ?? "",
          medical: eleve.medical ?? "",
          montantMensuel: eleve.montantMensuel != null ? String(eleve.montantMensuel) : "",
          typeAbonnement: eleve.typeAbonnement ?? "MENSUEL",
          nomFamille: eleve.nomFamille ?? "",
        });
        setFetching(false);
      });
  }, [id]);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (fetching) return <div className="text-sm text-[#666666]">Chargement...</div>;

  const inputClass = "w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]";
  const labelClass = "block text-sm font-medium text-[#1a1a1a] mb-1";

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/eleves/${id}`} className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Modifier l&apos;élève</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div className="bg-white rounded-[12px] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a] border-b border-[#e5e5e5] pb-3">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prénom *</label>
              <input required value={form.prenom} onChange={set("prenom")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nom *</label>
              <input required value={form.nom} onChange={set("nom")} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={set("email")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input value={form.telephone} onChange={set("telephone")} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date de naissance</label>
              <input type="date" value={form.dateNaissance} onChange={set("dateNaissance")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ceinture</label>
              <select value={form.ceinture} onChange={set("ceinture")} className={inputClass}>
                <option value="BLANCHE">Blanche</option>
                <option value="BLEUE">Bleue</option>
                <option value="VIOLETTE">Violette</option>
                <option value="MARRON">Marron</option>
                <option value="NOIRE">Noire</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Barrettes (0 à 4)</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm((f) => ({ ...f, barrettes: Math.max(0, f.barrettes - 1) }))}
                className="w-8 h-8 rounded-full border border-[#e5e5e5] text-lg font-bold text-[#666666] hover:border-[#cc0000] hover:text-[#cc0000] transition-colors flex items-center justify-center">−</button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span key={i} className={`w-3 h-5 rounded-sm ${i < form.barrettes ? "bg-[#cc0000]" : "bg-[#e5e5e5]"}`} />
                ))}
              </div>
              <button type="button" onClick={() => setForm((f) => ({ ...f, barrettes: Math.min(4, f.barrettes + 1) }))}
                className="w-8 h-8 rounded-full border border-[#e5e5e5] text-lg font-bold text-[#666666] hover:border-[#cc0000] hover:text-[#cc0000] transition-colors flex items-center justify-center">+</button>
              <span className="text-sm text-[#666666]">{form.barrettes}/4</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Poids (kg)</label>
              <input type="number" step="0.1" value={form.poids} onChange={set("poids")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Taille (cm)</label>
              <input type="number" step="1" value={form.taille} onChange={set("taille")} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Niveau sportif</label>
            <select value={form.niveauSport} onChange={set("niveauSport")} className={inputClass}>
              <option value="">— Non renseigné —</option>
              <option value="DEBUTANT">Débutant</option>
              <option value="INTERMEDIAIRE">Intermédiaire</option>
              <option value="AVANCE">Avancé</option>
              <option value="COMPETITEUR">Compétiteur</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Statut</label>
            <select value={form.actif ? "actif" : "inactif"} onChange={(e) => setForm((f) => ({ ...f, actif: e.target.value === "actif" }))} className={inputClass}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a] border-b border-[#e5e5e5] pb-3">Adresse</h2>
          <div>
            <label className={labelClass}>Adresse</label>
            <input value={form.adresse} onChange={set("adresse")} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ville</label>
              <input value={form.ville} onChange={set("ville")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Code postal</label>
              <input value={form.codePostal} onChange={set("codePostal")} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a] border-b border-[#e5e5e5] pb-3">Contact d&apos;urgence</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom du contact</label>
              <input value={form.contactUrgence} onChange={set("contactUrgence")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input value={form.telUrgence} onChange={set("telUrgence")} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a] border-b border-[#e5e5e5] pb-3">Abonnement &amp; Tarif</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type d&apos;abonnement</label>
              <select value={form.typeAbonnement} onChange={set("typeAbonnement")} className={inputClass}>
                <option value="MENSUEL">Mensuel</option>
                <option value="ANNUEL">Annuel</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tarif personnalisé (€/mois)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.montantMensuel}
                onChange={set("montantMensuel")}
                placeholder="Tarif par défaut"
                className={inputClass + " placeholder:text-[#aaaaaa]"}
              />
              <p className="text-xs text-[#aaaaaa] mt-1">Laisser vide pour utiliser le tarif standard</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>Nom de famille (réduction famille)</label>
            <input
              value={form.nomFamille}
              onChange={set("nomFamille")}
              placeholder="Ex : Martin"
              className={inputClass + " placeholder:text-[#aaaaaa]"}
            />
            <p className="text-xs text-[#aaaaaa] mt-1">Les élèves ayant le même nom de famille bénéficient de la réduction famille</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a] border-b border-[#e5e5e5] pb-3">Informations complémentaires</h2>
          <div>
            <label className={labelClass}>Objectifs</label>
            <textarea value={form.objectifs} onChange={set("objectifs")} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Informations médicales</label>
            <textarea value={form.medical} onChange={set("medical")} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Notes internes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className={inputClass} />
          </div>
        </div>

        {error && <p className="text-[#ef4444] text-sm">{error}</p>}
        <div className="flex items-center justify-between pb-6">
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-[#cc0000] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#aa0000] disabled:opacity-50 transition-colors">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
            <Link href={`/admin/eleves/${id}`} className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition-colors">
              Annuler
            </Link>
          </div>
          {!confirmSuppr ? (
            <button type="button" onClick={() => setConfirmSuppr(true)}
              className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#ef4444] transition-colors">
              <Trash2 size={15} />
              Désactiver l&apos;élève
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#ef4444]">Confirmer ?</span>
              <button type="button" onClick={archiver}
                className="bg-[#ef4444] text-white rounded-[8px] px-3 py-1.5 text-sm font-medium hover:bg-[#dc2626] transition-colors">
                Oui, désactiver
              </button>
              <button type="button" onClick={() => setConfirmSuppr(false)}
                className="text-sm text-[#666666] hover:text-[#1a1a1a]">
                Annuler
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
