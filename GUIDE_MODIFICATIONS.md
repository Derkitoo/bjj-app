# Guide de modifications — BJJ App

Ce guide t'explique comment modifier chaque section de l'app en autonomie.
Tous les chemins sont relatifs à la racine du projet (`bjj-app/`).

---

## 1. Comprendre l'architecture

L'app suit toujours le même schéma à 3 couches :

```
Base de données (Prisma)  →  API Route (Next.js)  →  Page / Composant (React)
prisma/schema.prisma          app/api/...               app/(admin)/admin/...
```

**Règle d'or :** quand tu changes quelque chose, tu touches les 3 couches dans cet ordre :
1. **Schema** → définit la structure des données
2. **API** → lit/écrit les données
3. **UI** → affiche et envoie les données

---

## 2. Modifier la base de données (Prisma)

### Ajouter un champ

1. Ouvre `prisma/schema.prisma`
2. Ajoute ton champ dans le bon `model`
3. Lance la migration dans le terminal (dans le dossier `bjj-app`) :
   ```
   npx prisma migrate dev --name nom_de_ta_migration
   ```

**Exemple — ajouter un champ `reseauSocial` facultatif à un élève :**
```prisma
model Eleve {
  // ... champs existants ...
  reseauSocial  String?   // le ? = facultatif (nullable)
}
```

**Types courants :**
| Type Prisma | Exemple | Obligatoire/Facultatif |
|-------------|---------|----------------------|
| `String` | nom, email | Obligatoire |
| `String?` | telephone, notes | Facultatif |
| `Int` | barrettes | Obligatoire entier |
| `Float?` | poids | Facultatif décimal |
| `Boolean` | actif | Booléen |
| `DateTime?` | dateNaissance | Date facultative |
| `String @default("valeur")` | ceinture | Obligatoire avec défaut |

### Supprimer un champ

1. Retire la ligne dans `prisma/schema.prisma`
2. Lance `npx prisma migrate dev --name suppression_champ`
3. ⚠️ **Attention** : si le champ a des données, elles seront perdues

---

## 3. Section Élèves

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `prisma/schema.prisma` → `model Eleve` | Structure BDD |
| `app/api/eleves/route.ts` | GET (liste) + POST (créer) |
| `app/api/eleves/[id]/route.ts` | GET (détail) + PUT (modifier) + DELETE (désactiver) |
| `app/(admin)/admin/eleves/page.tsx` | Page liste (serveur) |
| `app/(admin)/admin/eleves/ElevesList.tsx` | Composant liste avec filtres (client) |
| `app/(admin)/admin/eleves/[id]/page.tsx` | Fiche détail (serveur) |
| `app/(admin)/admin/eleves/[id]/modifier/page.tsx` | Formulaire modification (client) |
| `app/(admin)/admin/eleves/nouveau/page.tsx` | Formulaire création (client) |

---

### ➕ Ajouter un nouveau champ à un élève

**Exemple : ajouter un champ "Instagram"**

**Étape 1 — Schema (`prisma/schema.prisma`)**
```prisma
model Eleve {
  // ... après les champs existants ...
  instagram  String?
}
```
Puis : `npx prisma migrate dev --name add_instagram_eleve`

---

**Étape 2 — API PUT (`app/api/eleves/[id]/route.ts`)**

Cherche le bloc `const { nom, prenom, ... } = body;` et ajoute `instagram` :
```typescript
const {
  nom, prenom, email, /* ... tous les champs existants ... */
  instagram,  // ← ajouter ici
} = body;
```

Puis dans `data: { ... }` ajoute :
```typescript
instagram: instagram || null,
```

---

**Étape 3 — Formulaire modifier (`app/(admin)/admin/eleves/[id]/modifier/page.tsx`)**

Dans l'interface `FormData` :
```typescript
interface FormData {
  // ... champs existants ...
  instagram: string;  // ← ajouter
}
```

Dans `defaultForm` :
```typescript
const defaultForm: FormData = {
  // ... valeurs existantes ...
  instagram: "",  // ← ajouter
};
```

Dans le `useEffect` qui charge les données (le `.then((eleve) => { setForm({ ...`)) :
```typescript
instagram: eleve.instagram ?? "",  // ← ajouter
```

Dans le JSX, ajoute un input dans la section voulue :
```tsx
<div>
  <label className={labelClass}>Instagram</label>
  <input value={form.instagram} onChange={set("instagram")} className={inputClass} />
</div>
```

---

**Étape 4 — Affichage fiche détail (`app/(admin)/admin/eleves/[id]/page.tsx`)**

Dans la `<dl>` des informations, ajoute :
```tsx
{eleve.instagram && (
  <div>
    <dt className="text-xs text-[#666666]">Instagram</dt>
    <dd className="text-sm text-[#1a1a1a] mt-1">{eleve.instagram}</dd>
  </div>
)}
```

---

### ✏️ Modifier un label / texte existant

Cherche le texte dans le fichier concerné et change-le directement.

**Exemple — changer "Téléphone" en "Tél. portable" dans le formulaire :**
```
Fichier : app/(admin)/admin/eleves/[id]/modifier/page.tsx
Cherche : Téléphone
Remplace : Tél. portable
```

---

### 🗑️ Supprimer un champ existant

1. Retire la ligne du champ dans `prisma/schema.prisma` + migration
2. Retire le champ de l'interface `FormData` dans le formulaire modifier
3. Retire l'input du JSX dans le formulaire modifier
4. Retire le champ du `useEffect` de chargement
5. Retire le champ du `handleSubmit` / `body` envoyé à l'API
6. Retire le champ de l'API PUT
7. Retire l'affichage dans la fiche détail

---

### ➕ Ajouter un filtre dans la liste des élèves

Fichier : `app/(admin)/admin/eleves/ElevesList.tsx`

**Exemple — filtre par niveau sportif**

1. Ajoute un state : `const [niveau, setNiveau] = useState("");`
2. Ajoute la condition dans `filtered` (dans `useMemo`) :
   ```typescript
   if (niveau && e.niveauSport !== niveau) return false;
   ```
3. Ajoute un `<select>` dans le JSX de la barre de filtres :
   ```tsx
   <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className={selectClass}>
     <option value="">Tous les niveaux</option>
     <option value="DEBUTANT">Débutant</option>
     <option value="INTERMEDIAIRE">Intermédiaire</option>
   </select>
   ```

---

## 4. Section Planning (Cours)

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `prisma/schema.prisma` → `model Cours` | Structure BDD |
| `app/api/cours/route.ts` | GET (liste) + POST (créer) |
| `app/api/cours/[id]/route.ts` | PUT (modifier) + DELETE (supprimer) |
| `app/(admin)/admin/planning/page.tsx` | Tout-en-un : planning + formulaire modal |

---

### ➕ Ajouter un type de cours

Fichier : `app/(admin)/admin/planning/page.tsx`

Cherche la constante `TYPES` (ligne ~22) :
```typescript
const TYPES: Record<string, string> = {
  GI: "Gi",
  NO_GI: "No-Gi",
  KIDS: "Kids",
  COMPETITION: "Compétition",
  OPEN_MAT: "Open Mat",
  SELF_DEFENSE: "Self-Défense",  // ← ajouter ici
};
```

Ajoute aussi sa couleur dans `TYPE_COLORS` :
```typescript
const TYPE_COLORS = {
  // ... couleurs existantes ...
  SELF_DEFENSE: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", dot: "#f59e0b" },
};
```

---

### ✏️ Modifier les horaires du planning

Fichier : `app/(admin)/admin/planning/page.tsx`

- **Heure de début de la grille** : cherche `HOUR_START = 7` → change `7` par l'heure voulue
- **Heure de fin** : cherche `HOUR_END = 22` → change la valeur
- **Valeur par défaut du formulaire** : cherche `DEFAULT_FORM` → change `heureDebut: "19:00"` ou `duree: 90`

---

### 🗑️ Supprimer un cours (depuis l'interface)

Le bouton poubelle sur chaque cours appelle `supprimer(c.id)` qui fait un `DELETE /api/cours/:id`.
C'est déjà en place — rien à coder.

---

## 5. Section Présence

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `app/api/presences/cours/[coursId]/route.ts` | GET/POST/DELETE présences d'un cours |
| `app/api/presences/qrcode/route.ts` | Génération QR Code |
| `app/api/presences/scan/route.ts` | Traitement du scan QR |
| `app/(admin)/admin/presence/cours/page.tsx` | Interface présence par cours |

---

### ✏️ Modifier la durée de validité du QR Code

Fichier : `app/api/presences/qrcode/route.ts`

Cherche la ligne qui calcule `expires` (quelque chose comme `+ 90 * 60 * 1000`) et change `90` par le nombre de minutes voulu.

Dans `app/(admin)/admin/presence/cours/page.tsx`, cherche aussi `90 * 60 * 1000` dans la barre de progression et mets la même valeur.

---

### ➕ Ajouter une info affichée sur chaque présent

Fichier : `app/(admin)/admin/presence/cours/page.tsx`

Dans la section `/* Liste des présents */`, cherche le bloc qui affiche chaque présence :
```tsx
<p className="text-sm font-medium text-[#1a1a1a]">{p.eleve.prenom} {p.eleve.nom}</p>
```
Tu peux ajouter en dessous :
```tsx
<p className="text-xs text-[#666666]">{p.eleve.categorie}</p>
```

⚠️ Pour afficher de nouvelles données, il faut aussi qu'elles soient dans la réponse API. Vérifie que `app/api/presences/cours/[coursId]/route.ts` inclut le champ dans `eleve: { select: { ... } }`.

---

## 6. Section Ceintures

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `app/api/ceintures/promouvoir/route.ts` | Promouvoir un élève |
| `app/api/ceintures/barrettes/route.ts` | Ajouter/retirer une barrette |
| `app/api/ceintures/criteres/route.ts` | Gérer les critères de promotion |
| `app/(admin)/admin/ceintures/page.tsx` | Liste des élèves + actions |
| `app/(admin)/admin/ceintures/criteres/page.tsx` | Gestion des critères |
| `app/api/eleve/profil/route.ts` | Calcul de la progression (côté élève) |

---

### ✏️ Modifier l'ordre des ceintures

Plusieurs endroits utilisent l'ordre. Cherche dans les fichiers concernés :
```typescript
const BELT_ORDER = { NOIRE: 0, MARRON: 1, VIOLETTE: 2, BLEUE: 3, BLANCHE: 4 };
```
ou
```typescript
const NEXT_BELT: Record<string, string> = {
  BLANCHE: "BLEUE", BLEUE: "VIOLETTE", VIOLETTE: "MARRON", MARRON: "NOIRE"
};
```

---

### ✏️ Modifier le calcul de la progression (barre sur le profil élève)

Fichier : `app/api/eleve/profil/route.ts`

Cherche la ligne :
```typescript
const progression = nextBelt ? Math.round((eleve.barrettes / 4) * 100) : 100;
```
Actuellement : progression = nb barrettes / 4.
Tu peux modifier la formule, par exemple pour inclure les présences si besoin.

---

## 7. Section Actualités (Posts)

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `prisma/schema.prisma` → `model Post` | Structure BDD |
| `app/api/posts/route.ts` | GET (liste) + POST (créer) |
| `app/api/posts/[id]/route.ts` | PUT (modifier) + DELETE (supprimer) |
| `app/(admin)/admin/actualites/page.tsx` | Interface admin |
| `app/(eleve)/eleve/actualites/page.tsx` | Vue élève |

---

### ➕ Ajouter une catégorie d'actualité

Fichier : `app/(admin)/admin/actualites/page.tsx`

Cherche la liste des catégories disponibles (probablement un tableau ou un `select`) et ajoute la nouvelle valeur.

Fait la même chose dans `app/(eleve)/eleve/actualites/page.tsx` si les catégories servent à filtrer côté élève.

---

### 🗑️ Supprimer une actualité (depuis l'interface)

Déjà en place via le bouton poubelle qui appelle `DELETE /api/posts/:id`.

---

## 8. Section Paiements / Cotisations

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `prisma/schema.prisma` → `model Cotisation`, `model Echeance` | Structure BDD |
| `app/api/cotisations/route.ts` | GET/POST cotisations |
| `app/api/cotisations/[id]/route.ts` | PUT cotisation |
| `app/api/cotisations/bulk/route.ts` | Génération en masse |
| `app/api/cotisations/[id]/echeances/[echId]/route.ts` | Modifier une échéance |
| `app/(admin)/admin/paiements/page.tsx` | Interface complète |

---

### ✏️ Modifier le tarif par défaut

Fichier : `app/(admin)/admin/paiements/page.tsx`

Cherche la valeur du montant de base (ex: `montantBase: 250`) et modifie-la.

---

### ✏️ Modifier les modes de paiement disponibles

Fichier : `app/(admin)/admin/paiements/page.tsx`

Cherche un `select` avec les options de mode de paiement (ESPECES, CHEQUE, VIREMENT, etc.) et ajoute/retire des `<option>`.

---

## 9. Section Comptes utilisateurs

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `prisma/schema.prisma` → `model User` | Structure BDD |
| `app/api/comptes/route.ts` | GET (liste) + POST (créer) |
| `app/api/comptes/[id]/route.ts` | PUT (activer/désactiver) |
| `app/(admin)/admin/comptes/page.tsx` | Interface admin |

---

## 10. Composants réutilisables

Ces composants sont utilisés dans toute l'app. Modifier l'un d'eux affecte **partout**.

| Fichier | Rôle |
|---------|------|
| `components/CeintureBadge.tsx` | Badge coloré ceinture |
| `components/BottomNav.tsx` | Navigation mobile (espace élève) |
| `app/(admin)/layout.tsx` | Sidebar + layout admin |
| `app/(eleve)/layout.tsx` | Layout espace élève |

---

### ✏️ Modifier le CeintureBadge (couleurs, style)

Fichier : `components/CeintureBadge.tsx`

Cherche l'objet qui mappe les couleurs par ceinture et modifie les classes Tailwind.

---

### ✏️ Ajouter un lien dans la sidebar admin

Fichier : `app/(admin)/layout.tsx`

Cherche le tableau de navigation (probablement un array d'objets `{ href, label, icon }`) et ajoute ton entrée.

---

## 11. Checklist pour chaque modification

### Ajouter un champ simple (texte, nombre)
- [ ] `prisma/schema.prisma` → ajouter le champ
- [ ] `npx prisma migrate dev --name description`
- [ ] API route `PUT` → destructurer + ajouter dans `data:`
- [ ] Interface `FormData` → ajouter le type
- [ ] `defaultForm` → ajouter la valeur initiale
- [ ] `useEffect` de chargement → mapper la valeur
- [ ] JSX formulaire → ajouter l'`<input>` ou `<select>`
- [ ] Page détail → afficher la valeur (si pertinent)

### Ajouter une option à un select existant
- [ ] Trouver le `<select>` dans la page concernée
- [ ] Ajouter un `<option value="VALEUR">Label</option>`
- [ ] Si utilisé comme filtre, mettre à jour la logique de filtre

### Modifier un texte/label
- [ ] Chercher le texte dans le fichier concerné
- [ ] Modifier directement

### Ajouter un filtre dans une liste
- [ ] Ajouter un `useState` pour la valeur du filtre
- [ ] Ajouter la condition dans le `useMemo`/`filter`
- [ ] Ajouter le `<select>` ou boutons dans le JSX

---

## 12. Commandes utiles

Toutes ces commandes sont à lancer dans le dossier `bjj-app/` :

```bash
# Voir les changements Prisma sans appliquer
npx prisma migrate diff

# Appliquer les changements BDD
npx prisma migrate dev --name description_du_changement

# Ouvrir l'interface BDD visuelle
npx prisma studio

# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Lancer le serveur local
npm run dev

# Déployer sur Vercel (si connecté)
git add .
git commit -m "description"
git push
```

---

## 13. Palette de couleurs de référence

| Usage | Valeur |
|-------|--------|
| Rouge principal | `#cc0000` / `var(--color-primary)` |
| Rouge hover | `#aa0000` / `var(--color-primary-dark)` |
| Rouge fond léger | `var(--color-primary-subtle)` |
| Texte principal | `#1a1a1a` |
| Texte secondaire | `#666666` |
| Texte tertiaire | `#999999` / `#aaaaaa` |
| Bordures | `#e5e5e5` |
| Fond léger | `#f9f9f9` |
| Fond page | `#f5f5f5` |

**Classes Tailwind standards dans l'app :**
```
Carte         : bg-white rounded-[12px] shadow-sm p-5
Bouton rouge  : bg-[#cc0000] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium
Bouton blanc  : border border-[#e5e5e5] text-[#666666] rounded-[8px] px-5 py-2.5 text-sm
Input         : border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]
Badge vert    : bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium
Badge gris    : bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium
```
