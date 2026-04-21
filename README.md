# Easy Travel

Plateforme de réservation de tickets de bus au Cameroun, pensée pour des compagnies multi-agences avec support des trajets aller et aller-retour.

Stack : **Next.js 16** (App Router, TypeScript, Tailwind), **PostgreSQL**, **Prisma**, auth JWT maison.

## Fonctionnalités

- Recherche de trajets multi-compagnies (FlixBus-like) avec ville de départ, arrivée, date, retour, passagers.
- Flow aller / aller-retour avec stepper, sélection de siège, paiement simulé (MoMo, Orange Money, Carte, Cash).
- Dashboards par rôle :
  - `SUPER_ADMIN` : compagnies, agences, villes, utilisateurs, KPIs globaux.
  - `COMPANY_ADMIN` : agences et routes de la compagnie, statistiques.
  - `AGENCY_ADMIN` : départs, véhicules, personnel d'une agence.
  - `STATION_MANAGER` : manifeste du jour + check-in via QR code / référence.
  - `USER` : recherche, réservation, billets avec QR.
- Modèle métier explicite **Company → Agency → Route → Departure** avec `BookingGroup` pour regrouper aller et retour, `Payment` et `Passenger`.

## Démarrage local

### 1. Base de données

```bash
docker compose up -d
```

Cela lance un PostgreSQL 16 sur `localhost:5432` (user `easytravel` / db `easytravel`).

### 2. Variables d'environnement

```bash
cp .env.example .env
# Ajuster AUTH_SECRET en production (chaîne aléatoire longue).
```

### 3. Installation et seed

```bash
npm install
npm run db:migrate   # applique le schéma
npm run db:seed      # 8 villes, 4 compagnies, 12 agences, 56 routes, 500 départs
npm run dev
```

### 4. Comptes de démo

Tous les comptes seed utilisent le mot de passe **`admin123`**.

| Rôle             | Email                    |
| ---------------- | ------------------------ |
| Super Admin      | admin@easytravel.cm      |
| Company Admin    | company@express.cm       |
| Agency Admin     | agency@express.cm        |
| Station Manager  | station@express.cm       |
| Client           | client@easytravel.cm     |

## Scripts utiles

- `npm run dev` — serveur de dev.
- `npm run build` — build production (inclut `prisma generate`).
- `npm run typecheck` — vérifie les types TypeScript.
- `npm run db:migrate|push|seed|reset` — gestion Prisma.

## Architecture rapide

```
app/
  api/              # routes Next.js (REST)
  admin/            # dashboards par rôle
  login, signup, results, checkout, bookings, agencies
components/         # composants clients partagés (AuthPages, SearchWidget, ...)
contexts/           # NavigationContext (auth + state) + LanguageContext
lib/                # prisma (singleton), auth (JWT), api (helpers)
prisma/
  schema.prisma     # domaine complet (18 tables)
  seed.ts           # données réalistes
docker-compose.yml  # Postgres 16
```
