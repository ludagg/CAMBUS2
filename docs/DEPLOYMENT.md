# Déploiement Easy Travel

Ce document décrit le déploiement en production sur **Vercel** + **Neon**
(Postgres managé). Alternatives équivalentes : Supabase, Railway, Fly.io
Postgres.

## 1. Base de données managée (Neon)

1. Crée un compte sur https://neon.tech et un projet `easytravel-prod`.
2. Récupère la connection string au format :
   ```
   postgresql://USER:PASSWORD@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Active **Point-in-time recovery** (7 jours minimum, 30 jours recommandé).
   Voir [BACKUPS.md](./BACKUPS.md).

## 2. Secrets à configurer sur Vercel

| Variable              | Obligatoire | Description                                        |
|-----------------------|-------------|----------------------------------------------------|
| `DATABASE_URL`        | ✅          | Connection string Neon (avec `sslmode=require`)    |
| `AUTH_SECRET`         | ✅          | `openssl rand -hex 64` — min 32 chars              |
| `PUBLIC_BASE_URL`     | ✅          | `https://easytravel.cm` (utilisé dans emails/SMS)  |
| `CRON_SECRET`         | ✅          | `openssl rand -hex 32` — protège `/api/cron/*`     |
| `FAPSHI_API_USER`     | ✅          | Identifiant API du service Fapshi                  |
| `FAPSHI_API_KEY`      | ✅          | Clé API du service Fapshi (affichée une seule fois) |
| `FAPSHI_ENV`          | ✅          | `sandbox` (défaut) ou `live`                       |
| `FAPSHI_WEBHOOK_SECRET` | ✅        | Même secret que sur le dashboard Fapshi (`x-wh-secret`) |
| `OM_WEBHOOK_SECRET`   | ⚠️          | Partagé avec Orange Money pour vérifier les hooks  |
| `MOMO_WEBHOOK_SECRET` | ⚠️          | Partagé avec MTN pour vérifier les hooks           |
| `RESEND_API_KEY`      | ⚪          | Sans → emails en mock console                      |
| `RESEND_FROM_EMAIL`   | ⚪          | `Easy Travel <noreply@easytravel.cm>`              |
| `TWILIO_ACCOUNT_SID`  | ⚪          | Sans → SMS en mock console                         |
| `TWILIO_AUTH_TOKEN`   | ⚪          | —                                                  |
| `TWILIO_FROM_NUMBER`  | ⚪          | —                                                  |

## 3. Premier déploiement

```bash
# (machine locale, une seule fois)
npm install -g vercel
vercel login

# depuis la racine du repo :
vercel link                       # rattache le dossier au projet
vercel env add DATABASE_URL       # répéter pour chaque secret du tableau
# ...

# Appliquer le schéma sur la base de prod :
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Seed optionnel (comptes de démo + villes + compagnies) :
DATABASE_URL="postgresql://..." npm run db:seed

# Déploiement :
vercel --prod
```

## 4. Déploiements suivants

- `git push` vers `main` → déploiement auto Vercel.
- Migrations Prisma : ajoutées dans `prisma/migrations/*`. Vercel exécute
  `npx prisma migrate deploy` via `build` si tu ajoutes la commande au script
  `vercel-build` dans `package.json`. Sinon, exécute-la manuellement depuis
  ta machine avant de merger une migration.

## 5. Vérifications post-déploiement

```bash
curl https://easytravel.cm/api/health
# => { "status": "ok", "db": "ok", "version": "..." }
```

- Teste l'authentification (login/register).
- Teste un booking end-to-end (Mobile Money simulé jusqu'à confirmation).
- Vérifie que le cron tourne : Vercel → Settings → Cron Jobs → `/api/cron/release-pending` toutes les 5 min.
- Vérifie les headers de sécurité avec `curl -I https://easytravel.cm/`.

## 6. Webhooks Mobile Money

- **Orange Money** : URL à déclarer auprès d'Orange :
  ```
  https://easytravel.cm/api/webhooks/om
  Header: X-Signature: sha256=<HMAC_SHA256(body, OM_WEBHOOK_SECRET)>
  ```
- **MTN MoMo** : URL à déclarer auprès de MTN :
  ```
  https://easytravel.cm/api/webhooks/momo
  Header: X-Signature: sha256=<HMAC_SHA256(body, MOMO_WEBHOOK_SECRET)>
  ```

Le handler est idempotent (re-post du même événement = no-op) et rejette
toute requête sans signature valide en production.

## 7. Monitoring

- `/api/health` → à brancher sur UptimeRobot / BetterStack / Vercel Monitoring.
- Logs Vercel : `vercel logs --follow`.
- Alertes suggérées : health 5xx > 1 min, latence p95 > 2s, erreurs DB.


## Paiement Mobile Money — Fapshi

Easy Travel utilise l'agrégateur [Fapshi](https://fapshi.com) (MTN MoMo + Orange Money)
en « direct pay » : le client reçoit une demande de confirmation sur son téléphone.

1. Crée un compte Fapshi puis un *service* ; récupère `apiuser` et `apikey`
   (sandbox d'abord, ils sont distincts de ceux du mode live).
2. Renseigne `FAPSHI_API_USER`, `FAPSHI_API_KEY`, `FAPSHI_ENV=sandbox` sur Vercel.
3. Sur le dashboard Fapshi, configure le webhook du service :
   `https://<ton-domaine>/api/webhooks/fapshi` avec un secret, et mets ce secret dans
   `FAPSHI_WEBHOOK_SECRET`.
4. Test en sandbox : `670000000` / `690000000` réussissent, `670000001` / `690000001`
   échouent (autres numéros : résultat aléatoire).
5. Passage en production : active ton compte Fapshi (et *direct pay*, désactivé par
   défaut en live), mets les identifiants live et `FAPSHI_ENV=live`.

Fapshi n'envoie **qu'un seul** webhook par événement (pas de nouvelle tentative) : la page
de paiement interroge aussi `/payment-status` (limité à 6 requêtes/minute par transaction)
et le cron vérifie chez Fapshi avant de libérer une réservation expirée.
Sans identifiants Fapshi, un simulateur confirme tous les paiements : il est **refusé en
production** sauf `ALLOW_SIMULATED_PAYMENTS=true` (démo uniquement).
