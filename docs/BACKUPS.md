# Stratégie de sauvegarde Easy Travel

## 1. Point-in-time recovery (Neon)

**Par défaut** (plan Launch, 7 jours d'historique) :

- Neon capture en continu les WAL de Postgres. On peut restaurer à n'importe
  quel instant sur les dernières 7 jours.
- Restauration : Neon Console → Project → Restore → "Restore to point in time".

**Plan recommandé (Scale)** : 30 jours de rétention.

## 2. Sauvegarde hors-plateforme (obligatoire)

Ne jamais dépendre uniquement du provider. Programmer un dump hebdomadaire
indépendant vers un bucket S3 / R2 / Backblaze.

### Script `scripts/backup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%Y-%m-%d)
FILE="easytravel-${DATE}.sql.gz"

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip -9 > "/tmp/${FILE}"

aws s3 cp "/tmp/${FILE}" "s3://easytravel-backups/${FILE}" \
  --storage-class STANDARD_IA

# Rotation : garder 12 semaines + 12 mois
aws s3 ls s3://easytravel-backups/ \
  | sort -r \
  | awk 'NR>90 {print $4}' \
  | xargs -I {} aws s3 rm "s3://easytravel-backups/{}"
```

### Programmation GitHub Actions (hebdomadaire)

```yaml
# .github/workflows/backup.yml
name: Weekly DB backup
on:
  schedule:
    - cron: '0 3 * * 0'  # Dimanche 03:00 UTC
  workflow_dispatch:
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install pg_dump 16
        run: sudo apt-get install -y postgresql-client-16
      - name: Backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AWS_ACCESS_KEY_ID: ${{ secrets.BACKUP_AWS_KEY }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.BACKUP_AWS_SECRET }}
          AWS_DEFAULT_REGION: eu-central-1
        run: bash scripts/backup.sh
```

## 3. Test de restauration (mensuel)

Tous les mois :

1. Crée une DB Neon vide (`easytravel-restore-test`).
2. `gunzip -c easytravel-YYYY-MM-DD.sql.gz | psql $RESTORE_URL`.
3. Vérifie les counts critiques :
   ```sql
   SELECT COUNT(*) FROM "Booking";
   SELECT COUNT(*) FROM "BookingGroup" WHERE "status" = 'CONFIRMED';
   SELECT COUNT(*) FROM "Payment" WHERE "status" = 'SUCCEEDED';
   ```
4. Supprime la DB de test.

Sans test de restauration, **on n'a pas de backup** — juste une croyance.

## 4. Rétention recommandée

| Type                 | Fréquence | Rétention | Destination        |
|----------------------|-----------|-----------|--------------------|
| WAL (Neon PITR)      | continue  | 30 jours  | Neon (intégré)     |
| Dump complet         | hebdo     | 12 semaines | S3 Standard-IA   |
| Dump mensuel         | mensuel   | 12 mois   | S3 Glacier         |
| Export Parquet       | mensuel   | 5 ans     | S3 (analytics)     |

## 5. Données sensibles

- **Hashes de mots de passe** : bcrypt 10 rounds → OK à stocker.
- **Numéros de téléphone** : PII. Chiffrer les backups au repos (SSE-S3
  suffisant ; SSE-KMS si budget).
- **QR codes** : sérialisables, pas de PII directe — mais liés au booking.
- **Logs applicatifs** : ne jamais logger les numéros complets (seulement
  les 4 derniers chiffres).
