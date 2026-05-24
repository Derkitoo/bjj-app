# Règles de code — BJJ App

## Langue
- TOUTE l'interface utilisateur doit être en **français** (labels, messages, placeholders, erreurs, notifications)
- Les noms de variables, fonctions et fichiers restent en anglais (convention de code)

## Stack obligatoire
- Next.js 14 avec App Router uniquement (pas de Pages Router)
- TypeScript strict — pas de `any`
- Tailwind CSS uniquement pour le style — pas de CSS custom ni de style inline
- Prisma pour toutes les requêtes BDD — pas de SQL brut
- NextAuth.js v5 pour l'authentification

## Structure des fichiers
```
app/
  (auth)/login/         → page de connexion
  (admin)/admin/        → routes protégées admin
  (eleve)/eleve/        → routes protégées élève
  api/                  → API routes
components/             → composants réutilisables
lib/                    → helpers, utils, auth
prisma/                 → schema.prisma, migrations, seed
documentation/          → NE JAMAIS MODIFIER CE DOSSIER
```

## Règles de code
- Composants React : toujours des fonctions fléchées avec export default
- Pas de commentaires évidents — seulement si la logique est non triviale
- Chaque API route doit vérifier le rôle de l'utilisateur avant d'agir
- Les mots de passe sont toujours hashés avec bcryptjs (jamais en clair)
- Utiliser `date-fns` pour toutes les manipulations de dates
- Utiliser `lucide-react` pour toutes les icônes
- Les formulaires utilisent l'état local React (useState) — pas de librairie externe
- Les erreurs API retournent toujours `{ error: string }` avec le bon status HTTP

## Design
- Respecter strictement la palette définie dans documentation/design.md
- Sidebar : fond #1a1a1a, accent rouge #cc0000
- Boutons principaux : fond #cc0000, texte blanc
- Border-radius standard : 8px pour les boutons, 12px pour les cartes
- Toujours responsive : tester l'affichage mobile (< 768px)

## Sécurité
- Toutes les routes /admin/* sont protégées par le middleware (rôle ADMIN requis)
- Toutes les routes /eleve/* sont protégées par le middleware (rôle ELEVE requis)
- Les tokens QR code ont une durée de vie limitée (90 minutes)
- Valider toutes les entrées utilisateur côté serveur

## Interdictions
- Ne jamais modifier le dossier `documentation/`
- Ne jamais modifier le fichier `claude.md`
- Pas de `console.log` laissés dans le code final
- Pas de `TODO` ou `FIXME` dans le code livré
- Pas de données hardcodées en dehors du fichier seed
