# Plan d'implémentation — BJJ App

## Stack technique
- **Frontend** : Next.js 14 (App Router) + Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : PostgreSQL via Prisma ORM
- **Auth** : NextAuth.js v5 (email/mot de passe, rôles Prof/Élève)
- **QR Code** : `qrcode` (génération serveur) + `html5-qrcode` (scan mobile)
- **Hébergement** : Vercel + Supabase

---

## Étape 1 — Initialisation du projet

1. Créer le projet : `npx create-next-app@latest bjj-app --typescript --tailwind --app`
2. Installer les dépendances :
   - `prisma @prisma/client`
   - `next-auth@beta`
   - `bcryptjs @types/bcryptjs`
   - `qrcode @types/qrcode`
   - `html5-qrcode`
   - `lucide-react`
   - `date-fns`
3. Initialiser Prisma : `npx prisma init`
4. Configurer `.env` avec `DATABASE_URL` (Supabase), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

---

## Étape 2 — Schéma de base de données (Prisma)

### Modèles

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(ELEVE)
  eleveId   String?  @unique
  eleve     Eleve?   @relation(fields: [eleveId], references: [id])
  createdAt DateTime @default(now())
}

enum Role {
  ADMIN
  ELEVE
}

model Eleve {
  id              String      @id @default(cuid())
  nom             String
  prenom          String
  dateNaissance   DateTime?
  email           String?
  telephone       String?
  photo           String?
  dateInscription DateTime    @default(now())
  actif           Boolean     @default(true)
  notes           String?
  ceinture        Ceinture    @default(BLANCHE)
  user            User?
  presences       Presence[]
  promotions      Promotion[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum Ceinture {
  BLANCHE
  BLEUE
  VIOLETTE
  MARRON
  NOIRE
}

model Promotion {
  id        String   @id @default(cuid())
  eleveId   String
  eleve     Eleve    @relation(fields: [eleveId], references: [id])
  ceinture  Ceinture
  date      DateTime @default(now())
}

model Cours {
  id          String     @id @default(cuid())
  titre       String?
  type        TypeCours
  jour        Int        // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  heureDebut  String     // format "19:00"
  duree       Int        // en minutes
  recurrent   Boolean    @default(false)
  dateSpeciale DateTime? // si cours ponctuel non récurrent
  annule      Boolean    @default(false)
  presences   Presence[]
  createdAt   DateTime   @default(now())
}

enum TypeCours {
  GI
  NO_GI
  KIDS
  COMPETITION
  OPEN_MAT
}

model Presence {
  id        String   @id @default(cuid())
  eleveId   String
  eleve     Eleve    @relation(fields: [eleveId], references: [id])
  coursId   String
  cours     Cours    @relation(fields: [coursId], references: [id])
  date      DateTime @default(now())
  @@unique([eleveId, coursId, date])
}

model CriterePromotion {
  id             String   @id @default(cuid())
  ceintureCible  Ceinture
  minCours       Int      @default(0)
  minMois        Int      @default(0)
  description    String?
}

model Post {
  id         String      @id @default(cuid())
  titre      String
  contenu    String
  videoUrl   String?
  categorie  Categorie
  publie     Boolean     @default(true)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

enum Categorie {
  TECHNIQUE
  COMPETITION
  CLUB
  DIVERS
}
```

Commandes :
- `npx prisma migrate dev --name init`
- `npx prisma generate`

---

## Étape 3 — Authentification (NextAuth.js)

### Fichiers à créer
- `app/api/auth/[...nextauth]/route.ts` : configuration NextAuth avec Credentials provider
- `lib/auth.ts` : helper `getSession`, middleware de rôle
- `middleware.ts` : protection des routes `/admin/*` (rôle ADMIN) et `/eleve/*` (rôle ELEVE)

### Logique
- Login email + mot de passe (bcryptjs pour le hash)
- Session contient : `id`, `email`, `role`, `eleveId`
- Redirection post-login : ADMIN → `/admin/dashboard`, ELEVE → `/eleve/accueil`

### Pages
- `app/(auth)/login/page.tsx` : formulaire de connexion

---

## Étape 4 — Layout et navigation

### Fichiers
- `app/(admin)/layout.tsx` : layout avec Sidebar admin
- `app/(eleve)/layout.tsx` : layout avec Sidebar/BottomNav élève
- `components/Sidebar.tsx` : sidebar desktop noir avec liens
- `components/BottomNav.tsx` : navigation mobile bottom bar
- `components/Header.tsx` : titre de page + action principale

### Comportement
- Desktop (>768px) : Sidebar visible, BottomNav caché
- Mobile (<768px) : Sidebar cachée, BottomNav visible
- Lien actif : texte rouge + fond légèrement rouge dans la sidebar

---

## Étape 5 — Module Élèves

### API Routes (`app/api/eleves/`)
- `GET /api/eleves` : liste tous les élèves (filtres : ceinture, actif)
- `POST /api/eleves` : créer un élève
- `GET /api/eleves/[id]` : détail d'un élève
- `PUT /api/eleves/[id]` : modifier un élève
- `PATCH /api/eleves/[id]/archiver` : archiver/désarchiver

### Pages Admin (`app/(admin)/admin/eleves/`)
- `page.tsx` : liste avec filtres, bouton "Ajouter"
- `[id]/page.tsx` : fiche détaillée avec onglets (infos, présences, ceintures, notes)
- `nouveau/page.tsx` : formulaire création
- `[id]/modifier/page.tsx` : formulaire modification

### Composants
- `EleveCard.tsx` : carte élève dans la liste (photo, nom, ceinture badge, dernière présence)
- `EleveForm.tsx` : formulaire réutilisable création/modification
- `CeintureBadge.tsx` : badge coloré selon la ceinture

---

## Étape 6 — Module Présence

### API Routes (`app/api/presences/`)
- `POST /api/presences/qrcode` : générer un QR code pour un cours (token JWT valable 90 min)
- `POST /api/presences/scan` : valider un scan QR (vérifier token, enregistrer présence)
- `GET /api/presences/cours/[coursId]` : liste des présents pour un cours
- `POST /api/presences/manuel` : ajouter/retirer manuellement une présence
- `GET /api/presences/eleve/[eleveId]` : historique de présence d'un élève

### Pages Admin (`app/(admin)/admin/presence/`)
- `page.tsx` : sélection du cours du jour, bouton générer QR, mode tablette
- `[coursId]/page.tsx` : vue temps réel présents + grille tablette + QR modal

### Pages Élève (`app/(eleve)/eleve/accueil/`)
- Section "Scanner le QR Code" avec bouton → ouvre le scanner caméra
- Confirmation après scan réussi

### Composants
- `QRCodeModal.tsx` : modal plein écran avec QR + timer countdown
- `GrillePresence.tsx` : grille de photos cliquables (mode tablette)
- `ScannerQR.tsx` : composant caméra avec html5-qrcode

---

## Étape 7 — Module Planning

### API Routes (`app/api/cours/`)
- `GET /api/cours` : liste des cours de la semaine en cours
- `POST /api/cours` : créer un cours
- `PUT /api/cours/[id]` : modifier un cours
- `PATCH /api/cours/[id]/annuler` : annuler un cours ponctuel
- `DELETE /api/cours/[id]` : supprimer un cours

### Pages Admin (`app/(admin)/admin/planning/`)
- `page.tsx` : vue semaine avec grille lundi-dimanche, bouton "Ajouter un cours"
- Formulaire création/modification en modal

### Pages Élève (`app/(eleve)/eleve/planning/`)
- `page.tsx` : vue semaine lecture seule

### Composants
- `VueSemaine.tsx` : grille 7 colonnes avec les cours par jour
- `CoursCard.tsx` : carte cours (heure, durée, type, badge couleur par type)
- `CoursForms.tsx` : formulaire création/modification

---

## Étape 8 — Module Ceintures

### API Routes (`app/api/ceintures/`)
- `GET /api/ceintures/eligibles` : liste des élèves éligibles à promotion
- `POST /api/ceintures/promouvoir` : body `{ eleveId, nouvelleCeinture }` → enregistre promotion
- `GET /api/ceintures/criteres` : récupère les critères de promotion
- `PUT /api/ceintures/criteres` : met à jour les critères

### Pages Admin (`app/(admin)/admin/ceintures/`)
- `page.tsx` : liste élèves avec ceinture + progression + bouton promouvoir
- Section "Éligibles" en haut mise en avant
- Modal confirmation de promotion

### Composants
- `ProgressionCeinture.tsx` : barre de progression vers la prochaine ceinture
- `PromotionModal.tsx` : confirmation avec résumé (nom, ceinture actuelle → nouvelle)

---

## Étape 9 — Module Actualités

### API Routes (`app/api/posts/`)
- `GET /api/posts` : liste des posts publiés (tri par date desc)
- `POST /api/posts` : créer un post (admin only)
- `PUT /api/posts/[id]` : modifier un post
- `DELETE /api/posts/[id]` : supprimer un post

### Pages Admin (`app/(admin)/admin/actualites/`)
- `page.tsx` : liste des posts + bouton "Nouveau post"
- Formulaire création/modification en modal ou page séparée

### Pages Élève (`app/(eleve)/eleve/actualites/`)
- `page.tsx` : feed lecture seule, tri par date

### Composants
- `PostCard.tsx` : titre, extrait, catégorie badge, date, vidéo YouTube intégrée
- `PostForm.tsx` : formulaire avec champs titre/contenu/videoUrl/catégorie

---

## Étape 10 — Tableau de bord Admin

### API Routes
- `GET /api/dashboard` : agrège présents aujourd'hui, prochain cours, élèves éligibles, dernier post

### Page (`app/(admin)/admin/dashboard/page.tsx`)
- Carte : "X présents aujourd'hui / Y élèves"
- Carte : "Prochain cours" avec heure et type
- Carte : "Élèves éligibles à promotion" (liste cliquable)
- Carte : "Dernier post" avec lien vers actualités
- Carte : "Taux de présence moyen du mois"

---

## Étape 11 — Profil élève

### Page (`app/(eleve)/eleve/profil/page.tsx`)
- Photo, nom, prénom, date d'inscription
- Ceinture actuelle avec badge coloré
- Statistiques : nombre de cours total, taux de présence du mois
- Historique des promotions

---

## Étape 12 — Seeding de la base de données

Créer `prisma/seed.ts` :
- 1 compte admin (email: admin@bjj.fr, password: admin123)
- 5 élèves de démonstration avec différentes ceintures
- Quelques cours récurrents
- 3 posts d'actualité

Commande : `npx prisma db seed`

---

## Objectif de validation (pour /goal)
L'objectif est atteint quand :
1. `npm run build` se termine sans erreur
2. `npm run dev` lance le serveur sur le port 3000 sans erreur
3. La page de login s'affiche sur http://localhost:3000/login
4. Le compte admin peut se connecter et accéder au dashboard
5. Toutes les pages listées dans ce plan existent et s'affichent sans erreur 500
6. Le QR Code se génère sur la page de présence
7. La grille tablette affiche les élèves seedés

---

## Ordre d'implémentation recommandé
1. Init projet + dépendances
2. Schéma Prisma + migration + seed
3. Authentification + middleware
4. Layout + navigation (sidebar/mobile)
5. Dashboard (squelette)
6. Module Élèves complet
7. Module Planning
8. Module Présence (QR + tablette)
9. Module Ceintures
10. Module Actualités
11. Profil élève
12. Tests et corrections finales
