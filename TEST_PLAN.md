# Test Plan — PR #2 (Ticket modal + QR)

## What changed (user-visible)
- Page **Billets** (`/bookings`) : chaque segment est désormais cliquable et ouvre un nouveau modal **billet** style boarding-pass avec QR code réel scannable.
- Bouton **« Voir le billet »** remplace l'ancienne pastille QR statique.
- Composant `components/TicketModal.tsx` (nouveau) — QR généré côté client via `qrcode` npm (`toDataURL`, 220×220, couleur primaire).

## Environnement
- Dev server local : `http://localhost:3000` (déjà lancé)
- DB : Postgres local seedée (8 villes, 4 compagnies, 500 départs sur 7 jours).

## Flow principal (preuve du feature)

### Étape 1 — Login client + création d'une réservation aller-retour
1. Aller sur `http://localhost:3000/login`.
2. Se connecter avec `client@easytravel.cm` / `admin123`.
   - **Attendu :** redirection vers `/` ; header affiche l'avatar « C » et le nom « Client Demo ».
3. Sur `/`, dans le SearchWidget, sélectionner tab **Aller-retour**, `Douala` → `Yaoundé`, date = aujourd'hui, retour = demain. Cliquer **Rechercher**.
   - **Attendu :** redirection vers `/results`, une liste d'au moins 2 départs Douala→Yaoundé s'affiche, chacun avec un prix XAF.
4. Cliquer **Sélectionner** sur le 1er départ aller.
   - **Attendu :** la page bascule automatiquement sur les départs retour Yaoundé→Douala (badge « Étape 2/2 — Retour »). Au moins 1 départ est proposé.
5. Cliquer **Sélectionner** sur le 1er départ retour.
   - **Attendu :** redirection vers `/checkout` avec récap Aller + Retour.
6. Sur `/checkout` : remplir Nom passager = `Pierre Kamdem`, CNI = `123456789`, téléphone = `+237670000000`, cliquer **Payer**.
   - **Attendu :** écran de succès « Réservation confirmée ». Bouton « Voir mes billets » visible.

### Étape 2 — Ouverture du modal Billet (feature clé)
7. Cliquer **Voir mes billets** (ou naviguer vers `/bookings`).
   - **Attendu :** la carte de la réservation précédente est affichée, avec 2 sous-cartes « Aller » et « Retour », chacune affichant une icône `qr_code_2`.
8. Cliquer sur la sous-carte **Aller**.
   - **Attendu — pass/fail concret :**
     - ✅ Un overlay sombre s'ouvre (`fixed inset-0 bg-black/60`).
     - ✅ Une carte billet centrée montre en haut « BILLET EASY TRAVEL », le nom de la compagnie, une puce « Aller ».
     - ✅ Les heures départ/arrivée (ex. `08:00 → 12:00`) et les villes Douala / Yaoundé sont présentes.
     - ✅ La ligne perforée (pointillés + 2 disques noirs de chaque côté) sépare infos et QR.
     - ✅ Dans la partie basse, **un QR code rendu (pas un placeholder animé)** de ~220×220 est visible — vérifier en lisant la balise `<img>` dans l'inspecteur : `src` commence par `data:image/png;base64,`.
     - ✅ Sous le QR, la référence qrCode apparaît en monospace (non vide).
     - ✅ Bouton ✕ en haut à droite ferme le modal ; clic sur l'overlay le ferme aussi.

### Étape 3 — Vérification end-to-end : le QR marche vraiment (adversarial)
Cette étape prouve que le QR encode une valeur valide et que le backend l'accepte. Une implémentation cassée produirait soit un QR corrompu, soit un code que `/api/bookings/checkin` rejette.

9. Dans le modal billet encore ouvert, copier la référence qrCode affichée sous le QR.
10. Se déconnecter. Se connecter avec `station@express.cm` / `admin123`.
    - **Attendu :** redirection vers `/admin/station`.
11. Dans le champ **Saisir ou scanner un QR code**, coller la référence copiée et appuyer Entrée.
    - **Attendu — pass/fail concret :**
      - ✅ Bannière verte avec texte `Pierre Kamdem • <gare origine> → <gare destination>`.
      - ✅ La ligne correspondante dans le manifeste du jour passe à statut `BOARDED`.
12. (Adversarial) Rescanner le même QR.
    - **Attendu :** erreur `Billet déjà validé.` en rouge — prouve que l'état a bien été persisté.

## Critère de succès global
- Modal s'ouvre avec QR `data:image/png;base64,...` rendu.
- Check-in station API renvoie succès la 1ère fois, « déjà validé » la 2ème.
- Dans le DevTools Network : `POST /api/bookings/checkin` status 200 la 1ère fois, 400 la 2ème.

## Hors scope
- Test unitaire de `qrcode.toDataURL`.
- Regression complète des autres flows (search mono-sens, dashboards super-admin) — couverts en pré-tests hors recording.
