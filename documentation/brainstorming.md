# Brainstorming — Fonctionnalités détaillées

## Rôles utilisateurs
- **Admin/Prof** : accès complet à toutes les fonctionnalités
- **Élève** : accès limité (présence, son profil, planning, actualités)

---

## Module 1 — Gestion des élèves (Admin only)
- Liste de tous les élèves avec : photo, nom, prénom, ceinture actuelle, statut (actif/inactif), dernière présence
- Filtres : par ceinture, par statut actif/inactif
- Fiche détaillée par élève :
  - Informations personnelles : nom, prénom, date de naissance, email, téléphone, date d'inscription
  - Photo de profil
  - Ceinture actuelle + date d'obtention
  - Historique complet des présences
  - Historique des promotions de ceinture
  - Notes libres du prof
- Formulaire ajout d'un nouvel élève
- Formulaire modification d'un élève existant
- Archivage (désactivation) d'un élève sans suppression

---

## Module 2 — Présence (Admin + Élève)
### Côté Admin/Prof
- Sélection du cours du jour (depuis le planning)
- Génération d'un QR Code unique par cours, valable 30 minutes avant et après l'heure de début
- Mode tablette : grille de photos des élèves actifs, tap sur la photo = marqué présent (vert)
- Vue temps réel des élèves présents / total
- Correction manuelle : le prof peut ajouter ou retirer une présence
- Historique de présence par cours

### Côté Élève
- Page d'accueil avec bouton "Scanner le QR Code" du cours en cours
- Scan via caméra du téléphone → check-in automatique
- Confirmation visuelle "Vous êtes marqué présent"

---

## Module 3 — Planning (Admin only pour la saisie, lecture pour tous)
- Vue semaine (lundi → dimanche) avec les cours du club
- Chaque cours affiche : jour, heure de début, durée, type (Gi / No-Gi / Kids / Compétition / Open Mat)
- Formulaire d'ajout d'un cours : jour, heure, durée, type, description optionnelle
- Possibilité de créer un cours récurrent (ex: tous les lundis à 19h)
- Modification / annulation d'un cours ponctuel sans affecter le récurrent
- Vue lecture seule pour les élèves

---

## Module 4 — Ceintures & Progression (Admin only)
### Ceintures BJJ (dans l'ordre)
Blanc → Bleu → Violet → Marron → Noir

### Fonctionnalités
- Affichage de la ceinture actuelle de chaque élève avec la couleur réelle
- Définition manuelle des critères de passage par le prof (ex: minimum 50 cours, minimum 6 mois, évaluation validée)
- Indicateur de progression : pourcentage d'avancement vers la prochaine ceinture
- Mise en avant automatique des élèves éligibles (critères remplis)
- Bouton "Promouvoir" par élève → confirmation → mise à jour de la ceinture + date
- Historique complet des promotions avec date

---

## Module 5 — Actualités & Technique (Admin only pour la publication)
- Feed de posts visible par tous (prof + élèves)
- Création d'un post : titre, texte, lien vidéo YouTube (intégré), catégorie
- Catégories : Technique, Compétition, Club, Divers
- Tri par date (plus récent en premier)
- Lecture seule pour les élèves (pas de commentaires)

---

## Module 6 — Tableau de bord (Admin only)
- Nombre d'élèves présents aujourd'hui vs total
- Prochain cours : heure + type
- Liste des élèves éligibles à une promotion de ceinture
- Dernier post publié dans les actualités
- Statistiques globales : taux de présence moyen du mois

---

## Précisions techniques
- Langue de l'interface : Français uniquement
- Responsive : desktop en priorité, utilisable sur mobile
- Pas de gestion des paiements (hors scope V1)
- Pas de commentaires ou interactions sociales entre élèves
