
# Architecture Backend CamBus - Convex Edition

Cette application utilise **Convex** comme backend réactif. Contrairement à Firebase, Convex offre un état global synchronisé automatiquement entre tous les clients sans code de synchronisation manuel complexe.

## 1. Stack Technique
- **Base de données** : Convex Document Store (NoSQL).
- **Logique Métier** : Convex Functions (TypeScript) dans le dossier `convex/`.
- **Réactivité** : Hooks React `useQuery` et `useMutation`.
- **Typage** : TypeScript intégral via la génération de code Convex.

## 2. Schéma de Données (convex/schema.ts)
Les tables principales sont :
- `users` : Profils, rôles et authentification.
- `agencies` : Partenaires transporteurs avec leur branding.
- `cities` : Réseau de destinations disponibles.
- `bookings` : Réservations passagers.

## 3. Avantages de Convex pour CamBus
1. **Zéro Latence** : Les mises à jour (nouvelle réservation, changement de statut de bus) apparaissent instantanément sur tous les écrans (Super Admin, Station Manager).
2. **ACID Transactions** : Convex garantit que deux passagers ne peuvent pas réserver le même siège en même temps.
3. **Type Safety** : Les fonctions backend partagent les mêmes types que le frontend.

## 4. Guide de Déploiement Convex
1. Installer le CLI : `npm install -g convex`
2. Lancer le backend : `npx convex dev`
3. Configurer l'URL Convex dans le frontend via `CONVEX_URL`.
