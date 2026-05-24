import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, FileText } from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function EleveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: {
      presences: { orderBy: { date: "desc" }, take: 20, include: { cours: true } },
      promotions: { orderBy: { date: "desc" } },
      user: { select: { email: true, actif: true, motDePasseTemporaire: true, createdAt: true } },
    },
  });

  if (!eleve) notFound();

  const niveauLabel: Record<string, string> = {
    DEBUTANT: "Débutant", INTERMEDIAIRE: "Intermédiaire", AVANCE: "Avancé", COMPETITEUR: "Compétiteur",
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/eleves" className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a] flex-1">
          {eleve.prenom} {eleve.nom}
        </h1>
        <Link
          href={`/admin/eleves/${eleve.id}/justificatif`}
          className="flex items-center gap-2 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#f9f9f9] transition-colors"
        >
          <FileText size={14} />
          Justificatif
        </Link>
        <Link
          href={`/admin/eleves/${eleve.id}/modifier`}
          className="flex items-center gap-2 border border-[#cc0000] text-[#cc0000] rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[#cc0000] hover:text-white transition-colors"
        >
          <Pencil size={14} />
          Modifier
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Informations</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-[#666666]">Ceinture</dt>
              <dd className="mt-1"><CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} /></dd>
            </div>
            {eleve.email && (
              <div>
                <dt className="text-xs text-[#666666]">Email</dt>
                <dd className="text-sm text-[#1a1a1a] mt-1">{eleve.email}</dd>
              </div>
            )}
            {eleve.telephone && (
              <div>
                <dt className="text-xs text-[#666666]">Téléphone</dt>
                <dd className="text-sm text-[#1a1a1a] mt-1">{eleve.telephone}</dd>
              </div>
            )}
            {eleve.dateNaissance && (
              <div>
                <dt className="text-xs text-[#666666]">Date de naissance</dt>
                <dd className="text-sm text-[#1a1a1a] mt-1">
                  {format(new Date(eleve.dateNaissance), "d MMMM yyyy", { locale: fr })}
                </dd>
              </div>
            )}
            {(eleve.poids || eleve.taille) && (
              <div>
                <dt className="text-xs text-[#666666]">Morphologie</dt>
                <dd className="text-sm text-[#1a1a1a] mt-1">
                  {eleve.taille ? `${eleve.taille} cm` : ""}
                  {eleve.taille && eleve.poids ? " · " : ""}
                  {eleve.poids ? `${eleve.poids} kg` : ""}
                </dd>
              </div>
            )}
            {eleve.niveauSport && (
              <div>
                <dt className="text-xs text-[#666666]">Niveau</dt>
                <dd className="text-sm text-[#1a1a1a] mt-1">{niveauLabel[eleve.niveauSport] ?? eleve.niveauSport}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-[#666666]">Inscrit le</dt>
              <dd className="text-sm text-[#1a1a1a] mt-1">
                {format(new Date(eleve.dateInscription), "d MMMM yyyy", { locale: fr })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#666666]">Statut</dt>
              <dd className="mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eleve.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {eleve.actif ? "Actif" : "Inactif"}
                </span>
              </dd>
            </div>
          </dl>

          {(eleve.adresse || eleve.ville) && (
            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#666666] mb-1">Adresse</p>
              {eleve.adresse && <p className="text-sm text-[#1a1a1a]">{eleve.adresse}</p>}
              {(eleve.codePostal || eleve.ville) && (
                <p className="text-sm text-[#1a1a1a]">{[eleve.codePostal, eleve.ville].filter(Boolean).join(" ")}</p>
              )}
            </div>
          )}

          {(eleve.contactUrgence || eleve.telUrgence) && (
            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#666666] mb-1">Contact d&apos;urgence</p>
              {eleve.contactUrgence && <p className="text-sm text-[#1a1a1a]">{eleve.contactUrgence}</p>}
              {eleve.telUrgence && <p className="text-sm text-[#666666]">{eleve.telUrgence}</p>}
            </div>
          )}

          {eleve.medical && (
            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#666666] mb-1">Informations médicales</p>
              <p className="text-sm text-[#1a1a1a]">{eleve.medical}</p>
            </div>
          )}

          {eleve.objectifs && (
            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#666666] mb-1">Objectifs</p>
              <p className="text-sm text-[#1a1a1a]">{eleve.objectifs}</p>
            </div>
          )}

          {eleve.notes && (
            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#666666] mb-1">Notes</p>
              <p className="text-sm text-[#1a1a1a]">{eleve.notes}</p>
            </div>
          )}

          {eleve.user && (
            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#666666] mb-2">Compte</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eleve.user.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {eleve.user.actif ? "Actif" : "Désactivé"}
              </span>
              {eleve.user.motDePasseTemporaire && (
                <p className="text-xs text-orange-600 mt-1">⚠ Mot de passe temporaire</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">
            Présences ({eleve.presences.length})
          </h2>
          <ul className="space-y-2">
            {eleve.presences.map((p) => (
              <li key={p.id} className="text-sm text-[#1a1a1a] flex justify-between">
                <span>{format(new Date(p.date), "d MMM yyyy", { locale: fr })}</span>
                <span className="text-xs text-[#666666]">{p.cours.type.replace("_", " ")}</span>
              </li>
            ))}
            {eleve.presences.length === 0 && (
              <p className="text-sm text-[#666666]">Aucune présence enregistrée</p>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Historique ceintures</h2>
          <ul className="space-y-3">
            <li className="flex items-center justify-between">
              <CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} size="sm" />
              <span className="text-xs text-[#666666]">Actuelle</span>
            </li>
            {eleve.promotions.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <CeintureBadge ceinture={p.ceinture} size="sm" />
                <span className="text-xs text-[#666666]">
                  {format(new Date(p.date), "d MMM yyyy", { locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
