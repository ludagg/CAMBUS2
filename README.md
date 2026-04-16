# CamBus — Application de réservation de bus en ligne

## Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16 (App Router) + React 18 + TailwindCSS |
| Backend | Next.js API Routes (Route Handlers) |
| Base de données | **PostgreSQL** via **Prisma ORM** |
| Authentification | JWT (jose) + cookie HTTP-only |

## Prérequis

- Node.js ≥ 18
- Une base de données PostgreSQL (locale ou hébergée, ex. : Neon, Supabase, Railway)

## Démarrage

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer les variables d'environnement
Copiez `.env.local.example` en `.env.local` et renseignez vos valeurs :
```bash
cp .env.local.example .env.local
```

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cambus"
JWT_SECRET="votre-secret-jwt-long-et-aleatoire"
```

### 3. Initialiser la base de données
```bash
# Pousser le schéma Prisma vers la base
npm run db:push

# Injecter les données initiales (agences, gares, trajets, villes, comptes démo)
npm run db:seed
```

### 4. Lancer en développement
```bash
npm run dev
```

## Comptes de démonstration (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Super Admin | admin@easytravel.cm | Admin123! |
| Agency Admin | ceo@express.cm | Express123! |
| Station Manager | jean.d@express.cm | Station123! |
| Utilisateur | user@test.cm | User123! |

## Architecture

### Routes API

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Utilisateur courant |
| GET | `/api/trips?origin=X&destination=Y&date=Z` | Recherche de trajets |
| POST | `/api/trips` | Créer un trajet |
| GET | `/api/bookings` | Réservations de l'utilisateur |
| POST | `/api/bookings` | Créer une réservation (transaction) |
| PATCH | `/api/bookings/[id]` | Mettre à jour le statut |
| GET | `/api/agencies` | Liste des agences |
| POST | `/api/agencies` | Créer une agence |
| PATCH | `/api/agencies/[id]` | Modifier une agence |
| DELETE | `/api/agencies/[id]` | Désactiver une agence |
| GET | `/api/cities` | Liste des villes |
| POST | `/api/cities` | Créer une ville |
| PATCH | `/api/cities/[id]` | Modifier une ville |
| GET | `/api/users` | Liste des utilisateurs |
| PATCH | `/api/users/[id]` | Modifier le rôle d'un utilisateur |

### Schéma de base de données
Voir `prisma/schema.prisma` pour le schéma complet (User, Agency, Station, City, Trip, Booking).

## Commandes utiles

```bash
npm run dev          # Démarrer en développement
npm run build        # Build de production
npm run db:push      # Synchroniser le schéma avec la DB
npm run db:seed      # Injecter les données initiales
npm run db:studio    # Ouvrir Prisma Studio (interface visuelle DB)
```
