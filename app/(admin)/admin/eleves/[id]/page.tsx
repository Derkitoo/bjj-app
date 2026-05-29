import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, FileText, TrendingUp, Calendar, Award, ClipboardList } from "lucide-react";
import CeintureBadge from "@/components/CeintureBadge";
import { format, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";

export default async function EleveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const now = new Date();
  const debutAnnee = new Date(now.getFullYear(), 0, 1);
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

  const [eleve, presencesAnnee, presencesMois] = await Promise.all([
    prisma.eleve.findUnique({
      where: { id },
      include: {
        presences: { orderBy: { date: "desc" }, take: 20, include: { cours: true } },
        promotions: { orderBy: { date: "desc" } },
        user: { select: { email: true, actif: true, motDePasseTemporaire: true, createdAt: true } },
        examenParticipations: { include: { session: true } },
        _count: { select: { presences: true } },
      },
    }),
    prisma.presence.count({ where: { eleveId: id, date: { gte: debutAnnee } } }),
    prisma.presence.count({ where: { eleveId: id, date: { gte: debutMois } } }),
  ]);

  if (!eleve) notFound();

  const age = eleve.dateNaissance ? differenceInYears(now, new Date(eleve.dateNaissance)) : null;
  const totalPresences = eleve._count.presences;
  const dernierePresence = eleve.presences[0]?.date ?? null;
  const joursDepuisPresence = dernierePresence
    ? Math.floor((now.getTime() - new Date(dernierePresence).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const niveauLabel: Record<string, string> = {
    DEBUTANT: "Débutant", INTERMEDIAIRE: "Intermédiaire", AVANCE: "Avancé", COMPETITEUR: "Compétiteur",
  };

  const categorieLabel: Record<string, string> = {
    ADULTES: "🥋 Adultes (14 ans+)", KIDS: "⭐ Enfants (8–13 ans)",
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/eleves" className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a] flex-1">
          {eleve.prenom} {eleve.nom}
          {age !== null && <span className="text-base font-normal text-[#999999] ml-2">{age} ans</span>}
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

      {/* ── Statistiques de présence ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-[12px] shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#fff0f0] flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-[#cc0000]" />
          </div>
          <div>
            <p className="text-xl font-black text-[#cc0000]">{presencesMois}</p>
            <p className="text-xs text-[#999999]">Ce mois</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f0f4ff] flex items-center justify-center flex-shrink-0">
            <Calendar size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-black text-[#1a1a1a]">{presencesAnnee}</p>
            <p className="text-xs text-[#999999]">Cette année</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f5f5f5] flex items-center justify-center flex-shrink-0">
            <Award size={16} className="text-[#666666]" />
          </div>
          <div>
            <p className="text-xl font-black text-[#1a1a1a]">{totalPresences}</p>
            <p className="text-xs text-[#999999]">Total</p>
          </div>
        </div>
        <div className={`rounded-[12px] shadow-sm p-4 flex items-center gap-3 ${
          joursDepuisPresence === null ? "bg-white"
          : joursDepuisPresence > 30 ? "bg-orange-50"
          : "bg-white"
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            joursDepuisPresence !== null && joursDepuisPresence > 30 ? "bg-orange-100" : "bg-[#f5f5f5]"
          }`}>
            <span className="text-base">
              {joursDepuisPresence === null ? "—" : joursDepuisPresence === 0 ? "🟢" : joursDepuisPresence > 30 ? "🟠" : "🟢"}
            </span>
          </div>
          <div>
            <p className={`text-xl font-black ${joursDepuisPresence !== null && joursDepuisPresence > 30 ? "text-orange-500" : "text-[#1a1a1a]"}`}>
              {joursDepuisPresence === null ? "—" : `J-${joursDepuisPresence}`}
            </p>
            <p className="text-xs text-[#999999]">Dernière présence</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Informations ── */}
        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Informations</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-[#666666]">Ceinture</dt>
              <dd className="mt-1"><CeintureBadge ceinture={eleve.ceinture} barrettes={eleve.barrettes} /></dd>
            </div>
            <div>
              <dt className="text-xs text-[#666666]">Catégorie</dt>
              <dd className="text-sm text-[#1a1a1a] mt-1">{categorieLabel[eleve.categorie] ?? eleve.categorie}</dd>
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
                  {age !== null && <span className="text-[#999999] ml-1">({age} ans)</span>}
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

        {/* ── Présences ── */}
        <div className="bg-white rounded-[12px] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1a1a1a]">Présences</h2>
            <span className="text-xs text-[#999999]">{totalPresences} au total</span>
          </div>
          {dernierePresence && (
            <div className={`rounded-[8px] px-3 py-2 mb-3 text-xs ${
              joursDepuisPresence !== null && joursDepuisPresence > 30
                ? "bg-orange-50 text-orange-700"
                : "bg-green-50 text-green-700"
            }`}>
              Dernière présence : <span className="font-semibold">
                {format(new Date(dernierePresence), "d MMM yyyy", { locale: fr })}
              </span>
              {joursDepuisPresence !== null && joursDepuisPresence > 0 && (
                <span className="opacity-70"> · il y a {joursDepuisPresence} jours</span>
              )}
            </div>
          )}
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
            {totalPresences > 20 && (
              <p className="text-xs text-[#aaaaaa] pt-2 border-t border-[#f5f5f5]">
                Affichage des 20 dernières sur {totalPresences}
              </p>
            )}
          </ul>
        </div>

        {/* ── Historique ceintures ── */}
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

      {/* ── Examens ── */}
      <div className="mt-4 bg-white rounded-[12px] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1a1a1a] flex items-center gap-2">
            <ClipboardList size={16} className="text-[#cc0000]" />
            Examens
          </h2>
          <Link href="/admin/examens" className="text-xs text-[var(--color-primary)] hover:underline">
            Voir tous les examens →
          </Link>
        </div>
        {eleve.examenParticipations.length === 0 ? (
          <p className="text-sm text-[#999999]">Cet élève n&apos;a participé à aucun examen.</p>
        ) : (
          <div className="space-y-2">
            {eleve.examenParticipations.map((p) => {
              const BELT: Record<string, string> = { BLANCHE: "Blanche", BLEUE: "Bleue", VIOLETTE: "Violette", MARRON: "Marron", NOIRE: "Noire" };
              const RES: Record<string, { label: string; color: string }> = {
                REUSSI:         { label: "Réussi ✓",        color: "bg-green-100 text-green-700" },
                EN_PROGRESSION: { label: "En progression ↗", color: "bg-orange-100 text-orange-600" },
              };
              const res = p.resultat ? RES[p.resultat] : null;
              return (
                <Link key={p.id} href={`/admin/examens/${p.sessionId}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-[#f0f0f0] hover:border-[#cc0000] transition-colors">
                  <Award size={14} className="text-[#aaaaaa] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a]">Ceinture {BELT[p.session.ceintureCible] ?? p.session.ceintureCible}</p>
                    <p className="text-xs text-[#aaaaaa]">{format(new Date(p.session.date), "d MMM yyyy", { locale: fr })}</p>
                  </div>
                  {res && <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${res.color}`}>{res.label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

