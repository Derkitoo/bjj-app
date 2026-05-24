# Plan V2 — BJJ Manager

## Objectif
Partir sur une base saine (seed épuré, pas de faux élèves), ajouter la gestion complète des comptes utilisateurs, compléter les informations élèves et ajouter les fonctionnalités manquantes de la V1.

---

## Étape 1 — Base saine : reset du seed

### Supprimer toutes les fausses données
- Modifier `prisma/seed.ts` : garder **uniquement** le compte admin (`admin@bjj.fr`)
- Supprimer les 5 élèves fictifs, les cours fictifs, les posts fictifs, les présences fictives
- Réinitialiser la base Supabase : `prisma migrate reset --force` + `prisma db push`
- Relancer le seed épuré

### Seed V2 minimal
```
- 1 compte Admin : admin@bjj.fr / admin123
- 0 élève
- 0 cours
- 0 post
```

---

## Étape 2 — Gestion des comptes (Admin)

### Flux de création de compte élève
1. Admin remplit le formulaire "Nouvel élève" (nom, prénom, email, ceinture...)
2. L'app crée automatiquement un compte User associé à l'élève
3. Un mot de passe temporaire est généré et affiché à l'admin (ex: `BJJ-xxxx`)
4. L'élève se connecte avec ce mot de passe temporaire
5. À la première connexion, l'élève est forcé de changer son mot de passe

### Pages à créer
- `app/(admin)/admin/comptes/page.tsx` : liste de tous les comptes (email, rôle, élève associé, actif/inactif)
- `app/(admin)/admin/comptes/[id]/page.tsx` : détail compte + boutons (réinitialiser mot de passe, désactiver)
- `app/(eleve)/eleve/changer-mot-de-passe/page.tsx` : formulaire changement de mot de passe obligatoire

### API Routes
- `POST /api/comptes` : créer un compte lié à un élève, retourner le mot de passe temporaire
- `PATCH /api/comptes/[id]/reset` : réinitialiser le mot de passe (génère un nouveau temporaire)
- `PATCH /api/comptes/[id]/desactiver` : désactiver un compte sans supprimer
- `POST /api/eleve/changer-mot-de-passe` : l'élève change son propre mot de passe

### Schéma BDD — ajout au modèle User
```prisma
model User {
  ...
  motDePasseTemporaire Boolean @default(true)  // force le changement à la 1ère connexion
  actif                Boolean @default(true)
  derniereConnexion    DateTime?
}
```

---

## Étape 3 — Fiche élève complète

### Informations manquantes à ajouter au modèle Eleve
```prisma
model Eleve {
  ...
  poids           Float?     // en kg
  taille          Float?     // en cm
  adresse         String?
  ville           String?
  codePostal      String?
  contactUrgence  String?    // nom du contact
  telUrgence      String?    // téléphone urgence
  niveauSport     String?    // débutant / intermédiaire / avancé
  objectifs       String?    // texte libre : objectifs de l'élève
  medical         String?    // infos médicales (allergies, blessures)
}
```

### Page fiche élève enrichie (Admin)
- Onglet **Infos personnelles** : toutes les informations ci-dessus
- Onglet **Présences** : historique complet + stats (total cours, taux ce mois, graphique)
- Onglet **Ceintures** : historique des promotions + critères restants
- Onglet **Compte** : email, statut compte, bouton reset mot de passe
- Onglet **Notes** : notes libres du prof

### Page profil élève enrichie
- Ses informations personnelles + bouton modifier ses propres infos (email, téléphone, adresse)
- Ses stats de présence visuelles (compteur + barre de progression ceinture)
- Historique de ses promotions

---

## Étape 4 — Formulaire modifier un élève (V1 manquant)

### Page `app/(admin)/admin/eleves/[id]/modifier/page.tsx`
- Reprend le même formulaire que "Nouvel élève" mais pré-rempli
- Tous les champs de la fiche complète V2
- Bouton archiver (avec confirmation)
- Sauvegarde via `PUT /api/eleves/[id]`

---

## Étape 5 — Critères de promotion éditables dans l'UI

### Page `app/(admin)/admin/ceintures/criteres/page.tsx`
- Formulaire pour chaque ceinture cible (Bleue, Violette, Marron, Noire)
- Champs : nombre de cours minimum, nombre de mois minimum, description libre
- Sauvegarde via `PUT /api/ceintures/criteres`

---

## Étape 6 — Paiements (optionnel V2)

### Modèle BDD
```prisma
model Paiement {
  id        String   @id @default(cuid())
  eleveId   String
  eleve     Eleve    @relation(fields: [eleveId], references: [id])
  montant   Float
  mois      Int      // 1-12
  annee     Int
  statut    String   @default("EN_ATTENTE") // EN_ATTENTE / PAYE / RETARD
  date      DateTime?
  createdAt DateTime @default(now())
}
```

### Fonctionnalités
- Admin génère les paiements du mois pour tous les élèves actifs
- Marquer un paiement comme payé
- Vue liste des impayés
- Indicateur de statut paiement sur la fiche élève

---

## Étape 7 — Upload photo élève

### Stack
- Stockage : **Supabase Storage** (bucket `avatars`)
- Upload via `POST /api/eleves/[id]/photo`
- Affichage : `<img src={supabaseUrl}>` à la place des initiales

---

## Étape 8 — Statistiques avancées (Dashboard)

### Nouveaux indicateurs
- Graphique présences par mois (6 derniers mois) — librairie `recharts`
- Répartition par ceinture (camembert)
- Taux de rétention (élèves présents 3 semaines sur 4)
- Meilleur taux de présence (top 5 élèves)

---

## Étape 9 — PWA (Progressive Web App)

### Fichiers à créer
- `app/manifest.ts` : manifest PWA (nom, icônes, couleurs)
- `public/icons/` : icônes 192x192 et 512x512
- Configuration `next.config.ts` pour les service workers

### Résultat
- L'élève peut "installer" l'app sur son téléphone
- Fonctionne comme une vraie app mobile (icône sur l'écran d'accueil)

---

## Ordre d'implémentation recommandé

1. Reset seed (base saine)
2. Schéma BDD V2 (migration)
3. Fiche élève complète (champs supplémentaires)
4. Formulaire modifier un élève
5. Gestion des comptes (création, reset mdp, 1ère connexion)
6. Critères de promotion éditables
7. Paiements
8. Upload photo
9. Statistiques avancées
10. PWA

---

## Objectif de validation V2
L'objectif est atteint quand :
1. `npm run build` passe sans erreur
2. L'admin peut créer un élève + générer son compte en une seule action
3. L'élève se connecte avec le mot de passe temporaire et est forcé de le changer
4. La fiche élève affiche toutes les informations (5 onglets)
5. Les critères de promotion sont modifiables depuis l'UI
6. La base ne contient aucune donnée fictive au démarrage
7. Le serveur démarre sur le port 3000 sans erreur
