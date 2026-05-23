# AJ Pronos App — Guide de démarrage Alex

> Tout ce qu'il faut faire avant de pouvoir lancer la session Claude Code
> dans `app/` pour démarrer le code. ~30 minutes en suivant pas à pas.

---

## ÉTAPE 1 — Créer les comptes (gratuit, ~20 min)

Pour chaque outil ci-dessous, tu crées le compte, tu actives, et tu **copies les
clés API** dans le fichier `.env.local` (instructions plus bas).

### 1.1 — Supabase (base de données + auth) — 5 min

1. Va sur [supabase.com](https://supabase.com) → **Start your project**
2. Crée un compte (avec ton email DIGIFLOW ou personnel — peu importe)
3. Une fois connecté, clique **New Project**
   - **Nom** : `aj-pronos`
   - **Database password** : génère-en une forte, **note-la quelque part**
   - **Region** : `West EU (Paris)` ou `Central EU (Frankfurt)`
   - **Plan** : Free (suffit pour démarrer)
4. Attends ~1 min que le projet se crée
5. Va dans **Project Settings → API**
6. Copie 3 valeurs dans `.env.local` :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (clique « Reveal ») → `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 — Stripe (paiements) — 10 min

1. Va sur [stripe.com](https://stripe.com) → **Start now**
2. Crée le compte avec ton email pro
3. Tu peux **sauter** l'activation du compte business pour l'instant (besoin SIRET).
   On reste en **mode TEST** pendant tout le dev — pas de SIRET requis.
4. Dans le dashboard, vérifie en haut à droite : il doit y avoir un bandeau
   **« Test mode »** activé. Sinon, active-le.
5. Va dans **Developers → API keys**
6. Copie 2 valeurs dans `.env.local` :
   - `Publishable key` (commence par `pk_test_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` (commence par `sk_test_`, clique « Reveal ») → `STRIPE_SECRET_KEY`

> Les **price IDs** (Starter / Pro / VIP) seront créés plus tard quand on aura
> les produits configurés dans Stripe. Laisse vides pour l'instant.

### 1.3 — Resend (emails transactionnels) — 5 min

1. Va sur [resend.com](https://resend.com) → **Get Started**
2. Crée le compte
3. **API Keys** → **Create API Key** → nom `aj-pronos-dev`
4. Copie la clé (commence par `re_`) dans `.env.local` → `RESEND_API_KEY`
5. Tant que ton domaine `ajpronos.fr` n'est pas vérifié dans Resend, les
   emails partiront depuis `onboarding@resend.dev`. C'est OK pour le dev.

### 1.4 — API-Football (data des matchs) — 5 min

1. Va sur [rapidapi.com/api-sports/api/api-football](https://rapidapi.com/api-sports/api/api-football)
2. Clique **Subscribe to Test** → choisis le **Basic (Free)** plan
   (100 requêtes/jour gratuit, on upgrade plus tard)
3. Copie la clé API (`X-RapidAPI-Key`) dans `.env.local` → `API_FOOTBALL_KEY`

### 1.5 — Anthropic (Claude API) — 5 min

1. Va sur [console.anthropic.com](https://console.anthropic.com)
2. Crée le compte (ou connecte-toi si tu as déjà)
3. Va dans **Settings → API Keys**
4. **Create Key** → nom `aj-pronos-dev`
5. Copie la clé (commence par `sk-ant-`) dans `.env.local` → `ANTHROPIC_API_KEY`
6. **Ajoute du crédit** sur ton compte (Settings → Billing → Add credits) :
   commence par **$10** pour démarrer, ça suffit largement pour les tests.

---

## ÉTAPE 2 — Créer le fichier .env.local — 2 min

1. Dans le dossier `app/`, copie le template :
   ```bash
   cp .env.local.example .env.local
   ```
2. Ouvre `.env.local` dans ton éditeur (VS Code, etc.)
3. Remplace **chaque** placeholder par la vraie clé récupérée à l'Étape 1
4. Génère une `CRON_SECRET` aléatoire :
   ```bash
   openssl rand -hex 32
   ```
   et colle la chaîne dans `.env.local`

⚠️ **Ne commite JAMAIS le fichier `.env.local`** — il contient tes clés
sensibles. Il est déjà dans `.gitignore`.

---

## ÉTAPE 3 — Vérifier l'installation — 1 min

Toujours dans le dossier `app/` :

```bash
npm run dev
```

Tu devrais voir :
```
▲ Next.js 16.x.x (Turbopack)
- Local: http://localhost:3000
✓ Ready in XXXms
```

Ouvre [http://localhost:3000](http://localhost:3000) → tu vois la page Next.js
par défaut. C'est normal, l'app n'a pas encore son code métier.

---

## ÉTAPE 4 — Ouvrir Claude Code dans le dossier app/

1. **Nouveau terminal** (Cmd+T dans Terminal.app) OU nouvel onglet
2. Va dans le dossier app :
   ```bash
   cd ~/Documents/AJ-Pronos/app
   ```
3. Lance Claude Code :
   ```bash
   claude
   ```
4. Une fois Claude Code lancé dans ce dossier, tape :
   > « Lis le CLAUDE.md et démarre le dev de l'app AJ Pronos. On commence
   > par la connexion Supabase et la page de connexion. »

---

## Sommaire — Ce que tu dois avoir à la fin de l'Étape 1

- [ ] Compte Supabase + projet `aj-pronos` créé + 3 clés copiées
- [ ] Compte Stripe en mode test + 2 clés copiées
- [ ] Compte Resend + 1 clé copiée
- [ ] Compte RapidAPI + abonnement API-Football Free + 1 clé copiée
- [ ] Compte Anthropic + $10 de crédit + 1 clé copiée
- [ ] Fichier `.env.local` rempli avec toutes les clés
- [ ] `npm run dev` fonctionne dans `app/`

Tu as tout ça ? → **Étape 4** : nouveau terminal + nouvelle session Claude Code dans `app/`.

---

## En cas de blocage

- **Supabase** : si erreur lors de la création du projet → essaie une autre région
- **Stripe** : si « Account incomplete » → ignore, on reste en mode test
- **Anthropic** : si la clé ne marche pas → vérifie qu'il y a du crédit sur le compte
- **`npm run dev`** ne démarre pas → relance `npm install` dans `app/`

Tout autre souci → dis-le-moi dans la session vitrine actuelle.
