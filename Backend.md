# Architecture et Spécifications Backend - CamBus (Firebase Edition)

Ce document sert de référence technique pour le développement du backend de l'application CamBus en utilisant **Firebase**. L'approche est "Serverless", tirant parti de Firestore pour la base de données, Firebase Auth pour l'identité, et Cloud Storage pour les médias.

---

## 1. Stack Technologique & Services

*   **Plateforme :** Firebase (Google Cloud Platform).
*   **Base de Données :** Cloud Firestore (NoSQL Document Database).
*   **Authentification :** Firebase Authentication.
*   **Stockage Fichiers :** Cloud Storage for Firebase.
*   **Hébergement :** Firebase Hosting (ou Vercel pour le frontend).
*   **Logique Backend (Optionnel) :** Cloud Functions (pour les tâches complexes comme l'envoi d'emails ou le nettoyage de données).

---

## 2. Authentification & Sécurité

### 2.1. Firebase Authentication
*   **Providers :** Email/Mot de passe, Google Sign-In (optionnel).
*   **Gestion des Rôles :** Les rôles (`SUPER_ADMIN`, `AGENCY_ADMIN`, `STATION_MANAGER`, `USER`) seront gérés via les **Custom Claims** de Firebase Auth ou stockés dans le document `users/{userId}`.
    *   *Recommandation :* Stocker le rôle dans le document `public_profiles/{userId}` ou `users/{userId}` pour faciliter la lecture côté frontend, et utiliser des règles de sécurité Firestore basées sur ce document.

### 2.2. Règles de Sécurité Firestore (Firestore Rules)
C'est le pare-feu de l'application. Il ne faut jamais laisser la base de données en mode "test mode" (read/write: true).

**Exemple de stratégie de règles :**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction helper pour vérifier le rôle
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // Collection USERS
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || hasRole('super_admin'));
      allow write: if request.auth.uid == userId; // L'utilisateur peut modifier son profil
    }

    // Collection AGENCIES
    match /agencies/{agencyId} {
      allow read: if true; // Public pour la recherche
      allow write: if hasRole('super_admin') || (hasRole('agency_admin') && request.auth.token.agencyId == agencyId);
    }
    
    // Collection CITIES (Villes)
    match /cities/{cityId} {
      allow read: if true; // Public pour la recherche
      allow write: if hasRole('super_admin'); // Seul le super admin gère les villes
    }

    // Collection TRIPS
    match /trips/{tripId} {
      allow read: if true; // Public pour la recherche
      allow write: if hasRole('agency_admin'); // Seuls les admins d'agence créent des trajets
    }
    
    // Collection BOOKINGS
    match /bookings/{bookingId} {
      allow create: if request.auth != null; // Utilisateur connecté
      allow read: if request.auth.uid == resource.data.userId || hasRole('station_manager');
    }
  }
}
```

---

## 3. Modèle de Données (NoSQL - Firestore)

Contrairement au SQL, nous denormalisons les données pour optimiser la lecture.

### 3.1. Collection `users`
Document ID : `auth.uid`
```json
{
  "email": "user@example.com",
  "fullName": "Jean Dupont",
  "role": "user", // "super_admin", "agency_admin", "station_manager"
  "agencyId": "agency_123", // Optionnel (pour le staff)
  "stationId": "station_456", // Optionnel (pour le staff)
  "createdAt": Timestamp
}
```

### 3.2. Collection `agencies`
Document ID : Auto-generated ou slug
```json
{
  "name": "Express Voyage",
  "logoUrl": "https://firebasestorage...",
  "contactEmail": "contact@express.cm",
  "colorHex": "#2563eb",
  "status": "active",
  "stats": { // Agrégation pour lecture rapide
      "totalRoutes": 12,
      "fleetSize": 45
  }
}
```

### 3.3. Collection `stations`
Document ID : Auto-generated
```json
{
  "agencyId": "agency_123",
  "name": "Gare Centrale Douala",
  "location": { "lat": 4.05, "lng": 9.76 },
  "city": "Douala",
  "address": "Bd de la Liberté"
}
```

### 3.4. Collection `trips` (Trajets planifiés)
Document ID : Auto-generated
```json
{
  "agencyId": "agency_123",
  "agencyName": "Express Voyage", // Dénormalisé pour éviter une requête supplémentaire
  "agencyLogo": "...", // Dénormalisé
  "origin": "Douala",
  "destination": "Yaoundé",
  "departureTime": "07:30", // Format HH:mm
  "date": "2023-12-25", // Format YYYY-MM-DD pour requêtes simples
  "price": 4500,
  "totalSeats": 70,
  "seatsAvailable": 68,
  "seatsBooked": ["1A", "1B"], // Tableau des sièges occupés
  "status": "scheduled" // scheduled, boarding, completed, cancelled
}
```

### 3.5. Collection `bookings`
Document ID : Auto-generated
```json
{
  "userId": "user_xyz",
  "tripId": "trip_abc",
  "tripDate": "2023-12-25", // Dénormalisé
  "tripRoute": "Douala - Yaoundé", // Dénormalisé
  "seats": ["1A", "2B"],
  "totalPrice": 9000,
  "status": "confirmed",
  "qrCodeString": "CB-TRIPABC-USERXYZ-TIMESTAMP",
  "paymentMethod": "momo",
  "createdAt": Timestamp
}
```

### 3.6. Collection `cities` (Villes desservies)
Document ID : Auto-generated
```json
{
  "name": "Douala",
  "region": "Littoral",
  "status": "active", // active, inactive
  "createdAt": Timestamp
}
```

---

## 4. Logique Métier & Client-Side

### 4.1. Recherche de Trajets
Utiliser les index composites de Firestore.
```javascript
// Exemple de requête
const q = query(
  collection(db, "trips"),
  where("origin", "==", "Douala"),
  where("destination", "==", "Yaoundé"),
  where("date", "==", "2023-12-25"),
  where("seatsAvailable", ">", 0)
);
```

### 4.2. Flux de Réservation (Transaction)
Pour éviter les doubles réservations (race condition), utiliser une **Transaction Firestore**.

1.  **Lire** le document `trip` pour vérifier si les sièges demandés ne sont pas dans `seatsBooked` et si `seatsAvailable` est suffisant.
2.  **Si OK** :
    *   Mettre à jour le document `trip` : ajouter les sièges à `seatsBooked`, décrémenter `seatsAvailable`.
    *   Créer le document `booking`.
3.  **Si KO** : Annuler la transaction et informer l'utilisateur.

### 4.3. Scan QR Code (Station Manager)
1.  Le manager scanne le QR code (qui contient l'ID du booking).
2.  L'app requête `db.collection('bookings').doc(qrCodeId)`.
3.  Vérification côté client (ou Cloud Function) :
    *   Est-ce que le booking est pour aujourd'hui ?
    *   Est-ce que le statut est `confirmed` ?
4.  Update : Passer le statut à `boarded`.

---

## 5. Stockage (Storage)
Structure des dossiers :
*   `/agencies/{agencyId}/logo.png`
*   `/users/{userId}/avatar.jpg`

---

## 6. Checklist de Migration & Développement

1.  [x] Créer le projet Firebase Console.
2.  [x] Ajouter la config dans `firebase/config.ts`.
3.  [ ] Activer **Authentication** (Email/Password) dans la console.
4.  [ ] Créer la base de données **Firestore** en mode production (règles strictes).
5.  [ ] Développer un script de "Seed" pour remplir la base avec les données fictives (Agences, Gares, Trajets) afin que l'app ne soit pas vide.
6.  [ ] Remplacer les appels `mockData` dans les composants React par des `getDocs` ou `onSnapshot` (pour le temps réel).
7.  [ ] Implémenter le contexte d'authentification (`AuthProvider`) pour écouter `onAuthStateChanged`.