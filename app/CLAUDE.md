# AJ Pronos — App SaaS (espace membre + IA + admin)

> Web application Next.js d'AJ Pronos. Espace membre payant + dashboards admin
> (Julien validation + Alex publication) + 4 agents IA en coulisse.

@../CLAUDE.md

@AGENTS.md

---

## Posture (rappel)

Bien que AJ Pronos ne soit pas un client DIGIFLOW classique, on applique les
skills DIGIFLOW comme pour un projet client. Cf. `../CLAUDE.md` à la racine du
projet.

## Différence vitrine vs app

| | `site/` (vitrine) | `app/` (cette app) |
|---|---|---|
| **Public** | Visiteurs anonymes | Abonnés payants + admin (Alex, Julien) |
| **Auth** | Aucune | Supabase Auth (email + Google) |
| **Paiement** | Aucun (CTA vers la app) | Stripe Checkout + Customer Portal |
| **Données** | Statiques (data.ts) | Supabase Postgres + Realtime |
| **URL** | `ajpronos.fr` | `app.ajpronos.fr` (à brancher) |

## Stack technique

**Déjà installé** :
- Next.js 16 + React 19 + TypeScript + Tailwind v4 + Turbopack
- `@supabase/supabase-js` + `@supabase/ssr` (auth + DB + Realtime)
- `stripe` (paiements abonnements)
- `@anthropic-ai/sdk` (Claude API pour analyse IA des matchs)
- `resend` (emails transactionnels)
- `lucide-react` (icônes)

**À installer plus tard si besoin** :
- `shadcn/ui` (composants UI)
- `framer-motion` (animations)
- `react-hook-form` + `zod` (formulaires + validation)

---

## 🚨 Règles inviolables — Conformité gambling (rappel)

Mêmes règles que pour la vitrine, à respecter ici aussi :

### 1. Outil IA — JAMAIS public
- L'IA (Claude API) est **invisible publiquement**.
- L'utilisateur abonné ne voit que « pari validé par notre analyste ».
- Aucune mention de Claude / IA dans l'UI client.
- Le dashboard admin (Julien) peut afficher « Proposition IA » en interne.

### 2. Mentions légales obligatoires
- Bandeau « +18 » + lien `joueurs-info-service.fr` visible dans le footer de l'app.
- Disclaimer « Performance passée, ne préjuge pas du futur » sur les pages stats.

### 3. Aucune promesse de gain
- Vocabulaire : « pronostic », « recommandation », jamais « gain garanti ».

### 4. Sources de données autorisées uniquement
- ✅ API-Football (RapidAPI)
- ✅ APIs publiques avec licence claire
- ❌ Pas de scraping bookmakers (Pinnacle, Betfair, etc.)

### 5. Stripe activé UNIQUEMENT après SIRET Alex
- Avant SIRET : Stripe en mode test, checkout désactivé en prod, redirection « Liste d'attente ».
- Après SIRET : activation Stripe live, vérification bancaire.

---

## Architecture cible

```
app/
├── CLAUDE.md             ← ce fichier
├── README-DEMARRAGE.md   ← guide de setup pour Alex (comptes à créer, clés)
├── .env.local.example    ← template des variables d'environnement
├── .env.local            ← (gitignored) clés réelles
└── src/
    ├── app/
    │   ├── (auth)/                  ← inscription, connexion, mot de passe oublié
    │   ├── (member)/                ← espace abonné (pronos du jour, historique, salon VIP)
    │   ├── (admin)/                 ← dashboards Julien + Alex
    │   ├── api/
    │   │   ├── stripe/webhook       ← webhook Stripe (abonnements)
    │   │   ├── cron/collect         ← agent 1 : collecte data API-Football
    │   │   ├── cron/analyze         ← agent 2 : analyse Claude API → propositions
    │   │   └── cron/track-results   ← agent 4 : récupération résultats
    │   └── layout.tsx
    ├── components/
    ├── lib/
    │   ├── supabase/                ← client server/browser, RLS helpers
    │   ├── stripe/                  ← config Stripe, helpers checkout
    │   ├── ai/                      ← prompts Claude, helpers IA
    │   └── api-football/            ← client API-Football
    └── types/
```

## Workflow d'un pari (end-to-end)

1. **Agent 1 — Collecte** (cron 2×/jour) : pull matchs J/J+1 depuis API-Football → `matches` table
2. **Agent 2 — Analyste IA** (cron quotidien) : pour chaque match, prépare un contexte + appelle Claude API → propose `{ pari, mise, confiance, raisonnement }` → table `ai_proposals`
3. **Validation Julien** (manuel) : voit la file dans `/admin/proposals`, valide / modifie / rejette → table `validated_bets`
4. **Publication Alex** (manuel) : voit les paris validés, clique « Publier » → trigger push notif + email aux abonnés
5. **Agent 4 — Tracking** (cron quotidien J+1) : pull résultats des matchs joués → update `validated_bets.result`

## Modèles principaux Supabase (à créer en Phase 2)

| Table | Description |
|---|---|
| `users` | géré par Supabase Auth |
| `subscriptions` | abonnement actif par user (lien Stripe customer/subscription IDs) |
| `matches` | matchs collectés depuis API-Football |
| `ai_proposals` | propositions de paris générées par Claude, en attente de validation Julien |
| `validated_bets` | paris validés par Julien, en attente de publication par Alex |
| `published_bets` | paris publiés, visibles aux abonnés du bon tier |
| `notifications` | log des notifs envoyées |
| `vip_messages` | messages dans le salon VIP (chat Supabase Realtime) |

## Pricing (synchronisé avec la vitrine)

3 packs (Découverte supprimé) :

| Pack | Tarif | Caractéristique principale |
|---|---|---|
| **Starter** | 9,90 €/mois ou 95 €/an | Pronos veille (J-1) + 1 prono jour J |
| **Pro** | 24,90 €/mois ou 239 €/an | Pronos foot+tennis temps réel + recos IA |
| **VIP** | 59 €/mois ou 566 €/an · 50 places max | Salon privé in-app + Teams hebdo |

## Convention de commits

Format identique à la vitrine : `type(scope): description` en français.

Exemples app-specifiques :
- `feat(auth): supabase email+password login`
- `feat(stripe): checkout + webhook subscription`
- `feat(admin): dashboard validation propositions IA`
- `feat(ai): prompt Claude analyse match foot`
- `fix(realtime): chat VIP message duplication`

## Skills à mobiliser

- `claude-api` — pour tout ce qui touche prompts Claude, prompt caching, tool use
- `vercel-react-best-practices` — patterns React/Next.js perf
- `vercel-composition-patterns` — design composants réutilisables
- `lint-and-validate` — après chaque change (MANDATORY)
- `shadcn-ui` — si on installe shadcn pour les composants
- `web-design-guidelines` — audit UI

## En cas de doute

1. Relire `../CLAUDE.md` à la racine du projet (positionnement, règles inviolables)
2. Relire `../brief.md` et `../DESIGN.md` pour la cohérence d'image
3. Relire `../site/src/lib/data.ts` pour le pricing et les contenus
4. Demander à Alex sur le canal de chat
