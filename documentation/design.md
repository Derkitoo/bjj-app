# Design System — BJJ App

## Palette de couleurs
| Rôle | Valeur |
|---|---|
| Fond principal | `#f9f9f9` (blanc cassé) |
| Sidebar / Header | `#1a1a1a` (noir mat) |
| Accent principal | `#cc0000` (rouge BJJ) |
| Accent hover | `#aa0000` (rouge foncé) |
| Texte principal | `#1a1a1a` |
| Texte secondaire | `#666666` |
| Bordures | `#e5e5e5` |
| Succès | `#22c55e` |
| Erreur | `#ef4444` |
| Fond carte | `#ffffff` |

## Couleurs des ceintures
| Ceinture | Couleur |
|---|---|
| Blanche | `#ffffff` (bordure grise) |
| Bleue | `#1d4ed8` |
| Violette | `#7c3aed` |
| Marron | `#92400e` |
| Noire | `#111111` |

## Typographie
- Police principale : **Inter** (Google Fonts)
- Titre de page : 24px, font-bold
- Sous-titre / section : 18px, font-semibold
- Corps de texte : 14px, font-normal
- Labels / badges : 12px, font-medium

## Layout Desktop
- Sidebar fixe à gauche : largeur 240px, fond `#1a1a1a`, texte blanc
- Zone de contenu : reste de l'écran, fond `#f9f9f9`, padding 32px
- Header de page : titre + action principale (bouton rouge à droite)

## Layout Mobile
- Sidebar cachée
- Bottom navigation bar fixe : 5 icônes max, fond `#1a1a1a`, icône active en rouge
- Contenu : padding 16px

## Composants

### Bouton principal
- Fond `#cc0000`, texte blanc, border-radius 8px, padding 10px 20px
- Hover : fond `#aa0000`

### Bouton secondaire
- Fond transparent, bordure `#cc0000`, texte `#cc0000`, border-radius 8px
- Hover : fond `#cc0000`, texte blanc

### Carte (card)
- Fond blanc, border-radius 12px, ombre légère `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`
- Padding 20px

### Badge ceinture
- Pill coloré avec la couleur de la ceinture, texte blanc (ou noir pour blanche)
- Border-radius 999px, padding 4px 12px, font-size 12px

### Table / Liste
- Lignes alternées : blanc / `#f9f9f9`
- Hover ligne : fond `#fef2f2` (rouge très clair)
- Bordure basse `#e5e5e5`

### QR Code modal
- Fond noir semi-transparent en overlay
- QR Code centré, grand format (300x300px minimum)
- Timer de validité visible en dessous

### Grille tablette (mode présence)
- Grille 4 colonnes desktop, 3 colonnes tablette, 2 colonnes mobile
- Carte élève : photo ronde + nom + tap pour marquer présent
- Présent = bordure verte + check vert

## Icônes
- Librairie : **Lucide React**
- Taille standard : 20px
- Couleur dans sidebar : blanc (opacité 70% si inactif, 100% + texte rouge si actif)

## Navigation Sidebar (Admin)
```
🥋  Nom du club
─────────────────
📊  Tableau de bord
👥  Élèves
✅  Présence
🗓️  Planning
🥇  Ceintures
📰  Actualités
─────────────────
⚙️  Paramètres
```

## Navigation Sidebar (Élève)
```
🥋  Nom du club
─────────────────
🏠  Accueil
🗓️  Planning
📰  Actualités
👤  Mon profil
```
