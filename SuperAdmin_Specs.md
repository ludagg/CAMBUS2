# Spécifications de la Plateforme Super Admin - CamBus

Ce document définit le périmètre fonctionnel et technique du tableau de bord destiné au Super Administrateur de la plateforme CamBus.

## 1. Objectifs de la Plateforme
Le Super Admin est le garant de l'intégrité de l'écosystème CamBus. Ses responsabilités incluent :
- La gestion globale des acteurs (Agences de transport).
- Le contrôle du réseau (Villes et destinations).
- La supervision de la base utilisateur.
- Le suivi financier consolidé.

## 2. Accès et Sécurité
- **Authentification Obligatoire** : Aucun accès n'est possible sans une session Firebase Auth active.
- **Vérification de Rôle** : Le système vérifie la propriété `role: 'super_admin'` dans le document Firestore de l'utilisateur.
- **Protection des Routes** : Implémentée via un `AuthGuard` React qui redirige vers la page de login en cas de session non autorisée.

## 3. Fonctionnalités Clés

### 3.1. Tableau de Bord (Overview)
- **KPIs en Temps Réel** : 
    - Chiffre d'affaires total généré sur la plateforme.
    - Nombre d'agences partenaires actives.
    - Nombre de villes desservies.
    - Nombre total d'utilisateurs inscrits.
- **Graphiques de Performance** : Visualisation de la croissance des réservations.
- **Flux d'Activité** : Historique des dernières inscriptions et actions critiques.

### 3.2. Gestion des Agences (Partenaires)
- **Annuaire des Agences** : Liste complète avec logo, couleur de marque et statut.
- **CRUD Complet** : 
    - Création de nouvelles agences (Nom, Email, Couleur).
    - Modification des informations (Changement de logo, mise à jour des contacts).
    - Activation / Désactivation (Bloquer l'accès d'une agence en cas d'impayé ou litige).
    - Suppression définitive.

### 3.3. Gestion du Réseau (Villes)
- **Villes de Départ/Arrivée** : Gestion de la liste "Maître" des villes disponibles pour la recherche.
- **Zonage** : Association des villes à des régions pour faciliter le filtrage.
- **Contrôle d'Existence** : Empêche la suppression de villes si elles sont liées à des trajets actifs (Logique métier).

### 3.4. Gestion des Utilisateurs
- **Annuaire Global** : Vue sur tous les comptes (Utilisateurs, Admins d'agence, Chefs de gare).
- **Attribution de Rôles** : Capacité de promouvoir un utilisateur standard en `agency_admin` ou `station_manager`.
- **Modération** : Possibilité de suspendre des comptes utilisateurs.

### 3.5. Finances & Revenus
- **Tracking Consolidated** : Somme des commissions dues par chaque agence.
- **Rapports de Vente** : Historique des transactions consolidées par période.

## 4. Architecture Technique
- **Base de données** : Firestore (Mode Temps Réel avec `onSnapshot`).
- **Composants UI** : React + Tailwind CSS (Design System "Dark Luxury").
- **State Management** : React Context API (`NavigationContext`).
- **Sécurité Cloud** : Règles Firestore basées sur `request.auth.token.role`.

## 5. Guide d'utilisation (Seeding)
Pour une base de données vide, un bouton d'initialisation (Seeding) est disponible pour injecter les données de démonstration par défaut (Douala, Yaoundé, etc.).