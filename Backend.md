# Architecture et Spécifications Backend - CamBus

Ce document sert de référence technique pour le développement du backend de l'application CamBus. Le backend sera développé avec **Next.js (App Router - API Routes)** et **PostgreSQL**. L'objectif est de fournir une API RESTful sécurisée, performante et scalable pour consommer le frontend React (Vite).

---

## 1. Stack Technologique

*   **Framework :** Next.js 14+ (Utilisation exclusive des "Route Handlers" pour l'API).
*   **Langage :** TypeScript (Strict mode).
*   **Base de Données :** PostgreSQL.
*   **ORM :** Prisma (Recommandé pour la sécurité et le typage) ou Drizzle.
*   **Authentification :** Auth.js (NextAuth) v5 ou Lucia Auth.
*   **Validation :** Zod (pour valider les entrées API).
*   **Paiement (Simulation) :** Intégration fictive avec webhooks pour Mobile Money/Stripe.

---

## 2. Sécurité & Communication Frontend-Backend

La sécurité est la priorité absolue, étant donné la gestion de paiements et de données personnelles.

### 2.1. Authentification & Sessions
*   **Méthode :** Utilisation de **JWT (JSON Web Tokens)** stockés dans des **Cookies HTTP-Only, Secure, SameSite=Strict**.
    *   *Pourquoi ?* Le stockage dans `localStorage` est vulnérable aux failles XSS. Les cookies HTTP-Only empêchent le JavaScript côté client de lire le token.
*   **Flux :**
    1.  Le Frontend envoie `email/password` à `/api/auth/login`.
    2.  Le Backend valide, signe un JWT et renvoie un header `Set-Cookie`.
    3.  Chaque requête suivante du Frontend inclut automatiquement ce cookie.

### 2.2. Protection des Routes (Middleware)
Un Middleware Next.js doit intercepter toutes les requêtes vers `/api/admin/*`, `/api/agency/*` et `/api/station/*`.
*   Il décrypte le token.
*   Il vérifie le champ `role` du user.
*   Si le rôle ne correspond pas (ex: un `user` tente d'accéder à une route `super_admin`), renvoyer **403 Forbidden**.

### 2.3. Sécurité des Données
*   **Mots de passe :** Hachage obligatoire avec **Argon2** ou **Bcrypt**. Ne jamais stocker en clair.
*   **Validation des Entrées :** Toutes les données reçues (Body, Query params) doivent passer par un schéma **Zod** avant d'atteindre la base de données.
*   **CORS :** Configurer les headers CORS pour n'accepter que les requêtes provenant du domaine du Frontend (ex: `https://cambus-app.com`).
*   **Rate Limiting :** Implémenter `upstash/ratelimit` ou une solution similaire sur les routes de login et de recherche pour éviter les attaques brute-force et DDoS.

---

## 3. Structure de la Base de Données (PostgreSQL Schema)

Voici le schéma relationnel conceptuel (ERD) à implémenter.

### 3.1. Users & Roles
```sql
ENUM Role { USER, SUPER_ADMIN, AGENCY_ADMIN, STATION_MANAGER }

TABLE User {
  id            UUID PRIMARY KEY,
  email         VARCHAR UNIQUE NOT NULL,
  passwordHash  VARCHAR NOT NULL,
  fullName      VARCHAR NOT NULL,
  role          Role DEFAULT USER,
  agencyId      INT NULL, -- FK vers Agency (pour AgencyAdmin & StationManager)
  stationId     INT NULL, -- FK vers Station (pour StationManager uniquement)
  createdAt     TIMESTAMP
}
```

### 3.2. Agencies & Infrastructure
```sql
TABLE Agency {
  id            SERIAL PRIMARY KEY,
  name          VARCHAR NOT NULL,
  logoUrl       VARCHAR,
  colorHex      VARCHAR,
  contactEmail  VARCHAR,
  status        ENUM('ACTIVE', 'SUSPENDED')
}

TABLE Station {
  id            SERIAL PRIMARY KEY,
  agencyId      INT NOT NULL, -- FK Agency
  name          VARCHAR NOT NULL,
  address       VARCHAR NOT NULL,
  gpsLat        FLOAT,
  gpsLng        FLOAT,
  city          VARCHAR NOT NULL
}

TABLE Bus {
  id            SERIAL PRIMARY KEY,
  agencyId      INT NOT NULL,
  plateNumber   VARCHAR UNIQUE NOT NULL,
  model         VARCHAR,
  capacity      INT NOT NULL, -- Ex: 70 places
  status        ENUM('ACTIVE', 'MAINTENANCE', 'TRANSIT')
}
```

### 3.3. Voyages (Core Business)
**Concept clé :** Une `Route` est un modèle (ex: Douala->Yaoundé à 07:00). Un `Trip` est une instance concrète pour une date donnée (ex: Le Douala->Yaoundé du 25 Décembre).

```sql
TABLE Route {
  id            SERIAL PRIMARY KEY,
  agencyId      INT NOT NULL,
  origin        VARCHAR NOT NULL,
  destination   VARCHAR NOT NULL,
  basePrice     DECIMAL NOT NULL,
  departureTime TIME NOT NULL, -- 07:00
  estimatedDur  VARCHAR -- "4h"
}

TABLE Trip {
  id            SERIAL PRIMARY KEY,
  routeId       INT NOT NULL, -- FK Route
  busId         INT NULL,     -- FK Bus (assigné par Agency Admin)
  date          DATE NOT NULL,
  driverName    VARCHAR,
  status        ENUM('SCHEDULED', 'BOARDING', 'DEPARTED', 'COMPLETED', 'CANCELLED'),
  seatsAvailable INT NOT NULL -- Décrémenté à chaque résa
}
```

### 3.4. Réservations & Paiements
```sql
TABLE Booking {
  id            UUID PRIMARY KEY, -- C'est le Booking Reference (ex: CB-9821)
  tripId        INT NOT NULL,
  userId        UUID NOT NULL,
  seatNumbers   VARCHAR[] NOT NULL, -- Array: ["1A", "1B"]
  totalPrice    DECIMAL NOT NULL,
  status        ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'BOARDED'),
  qrCodeHash    VARCHAR UNIQUE NOT NULL, -- Hash pour validation
  paymentRef    VARCHAR, -- ID Transaction externe
  createdAt     TIMESTAMP
}
```

---

## 4. Endpoints API & Logique Métier

### 4.1. Public & Recherche
*   `GET /api/agencies` : Liste les agences actives.
*   `GET /api/trips?from=Douala&to=Yaounde&date=2023-12-25` :
    *   **Logique :** Cherche dans la table `Trip`. Si aucun `Trip` n'existe pour cette date mais qu'une `Route` existe, le backend peut "pré-générer" l'affichage, mais le `Trip` doit être créé en BDD au moment de la première réservation ou par un script CRON.
    *   **Retourne :** Liste des voyages avec prix, horaires, places restantes.

### 4.2. Flux de Réservation (Complexe)
*   `POST /api/bookings/create`
    *   **Body :** `{ tripId, seatNumbers[], paymentMethod, userDetails }`
    *   **Transaction Critique (ACID) :**
        1.  Démarrer une transaction SQL.
        2.  Vérifier si les `seatNumbers` sont libres pour ce `tripId`. **Verrouiller les lignes (Row Locking)** pour éviter les doubles réservations simultanées.
        3.  Si libre : Créer l'entrée `Booking` avec status `CONFIRMED` (si paiement réussi) et décrémenter `seatsAvailable` dans `Trip`.
        4.  Générer le `qrCodeHash` unique.
        5.  Commit transaction.
        6.  Envoyer email de confirmation (asynchrone).
    *   **Sécurité :** Vérifier que `totalPrice` correspond bien au `unitPrice * nbSeats` (ne pas faire confiance au prix envoyé par le frontend).

### 4.3. Super Admin (`/api/admin/*`)
*   `GET /stats` : Agrégation SQL (`SUM(totalPrice)`) sur toutes les réservations.
*   `POST /agencies` : Créer une nouvelle agence et son compte Admin par défaut.
*   `PATCH /agencies/:id/status` : Suspendre une agence (soft delete).

### 4.4. Agency Admin (`/api/agency/*`)
*   **Middleware :** Vérifie que `user.agencyId` correspond aux ressources demandées.
*   `GET /fleet` : Liste les bus.
*   `POST /routes` : Créer des modèles de trajets.
*   `GET /analytics` : Revenus par route, taux de remplissage des bus.

### 4.5. Station Manager (`/api/station/*`)
*   **Middleware :** Vérifie `user.role === STATION_MANAGER`.
*   `POST /scan-ticket`
    *   **Body :** `{ qrContent }`
    *   **Logique :**
        1.  Cherche le booking correspondant au hash.
        2.  Vérifie que `booking.trip.date` est aujourd'hui.
        3.  Vérifie que le départ est bien depuis la gare du manager (`user.stationId`).
        4.  Si `status === 'CONFIRMED'`, le passer à `BOARDED` et renvoyer "OK + Numéro de Siège".
        5.  Si `status === 'BOARDED'`, renvoyer "DÉJÀ VALIDÉ" (Alerte fraude).
*   `GET /manifest/:tripId` : Liste de tous les passagers pour un départ donné (pour impression papier ou contrôle police).

---

## 5. Gestion des Images
Pour les logos des agences et avatars :
*   Ne pas stocker les images en Base de Données (BLOB).
*   Utiliser un service de stockage d'objets (AWS S3, Cloudinary, ou Vercel Blob).
*   Stocker uniquement l'URL dans PostgreSQL (`logoUrl`).

---

## 6. Liste de contrôle pour le Développement

1.  [ ] Initialiser projet Next.js + TypeScript.
2.  [ ] Configurer Docker Compose pour PostgreSQL localement.
3.  [ ] Écrire le schéma Prisma et exécuter `prisma migrate`.
4.  [ ] Mettre en place Auth.js avec le provider "Credentials".
5.  [ ] Créer le Seed script (peupler la BDD avec Super Admin et Agences de démo).
6.  [ ] Développer l'API de recherche (`GET /trips`).
7.  [ ] Développer la logique de transaction pour `POST /bookings`.
8.  [ ] Implémenter le endpoint de scan QR sécurisé.
9.  [ ] Sécuriser les headers (Helmet) et Rate Limiting.
