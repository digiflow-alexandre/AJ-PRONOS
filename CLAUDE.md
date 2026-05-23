# AJ Pronos — Contexte projet

**Side project Alex + Julien** — Service de conseil en paris sportifs FR.
Stack vitrine + future app SaaS (paiement, dashboards, comptes).

> **Brief complet** : `brief.md` à la racine
> **Direction artistique validée** : `DESIGN.md` à la racine
> **Assets visuels** : `brand/`
> **Mockups HTML générés** : `variant-output/` (variantes A/A.v1-dark/B/C)

---

## Posture
Bien que ce projet ne soit pas un client DIGIFLOW classique, **tu appliques le pipeline et les skills DIGIFLOW comme pour un projet DIGIFLOW**. C'est-à-dire :
- `digiflow-envision` (DÉJÀ FAIT — DESIGN.md généré)
- `digiflow-variant` (DÉJÀ FAIT — 4 variantes HTML dans variant-output/)
- `digiflow-pre-deploy-check` (à utiliser AVANT chaque push prod)
- `perf-fix-nextjs` (à utiliser si Lighthouse < 90)
- `web-design-guidelines`, `emil-design-eng`, `lint-and-validate`, `motion-typography`, `animation-framer-motion-advanced`, `page-transitions`, `shadcn-ui`, `vercel-react-best-practices`, `vercel-composition-patterns`, `ssr-safe`

## Exceptions (différences avec un projet DIGIFLOW client)

| Aspect | DIGIFLOW client | AJ Pronos |
|---|---|---|
| **Emails** | Mail Hub Jarvis (Amazon SES centralisé) | **Supabase** (auth + transactional emails) — PAS de Mail Hub Jarvis |
| **Footer crédit** | "Site créé par DIGIFLOW / BE-HYPE" | **Footer custom AJ Pronos** (pas de mention DIGIFLOW) |
| **Mentions légales** | Skill `mentions-legales` block DIGIFLOW/BE-HYPE | **Auto-entreprise Alex** (à compléter via Pappers une fois immatriculé) |
| **Brief location** | `.claude/rules/@client-brief.md` | `brief.md` à la racine (déjà existant) |
| **Réservation/Be-Book** | Souvent pertinent | Non applicable |
| **Embeds Elfsight** | Souvent pertinent | Non applicable (ou marginal) |

## Structure du projet (monorepo)

```
~/Documents/AJ-Pronos/
├── CLAUDE.md             ← ce fichier (contexte global projet)
├── brief.md              ← brief stratégique complet
├── DESIGN.md             ← direction artistique validée
├── brand/                ← logos, hero variants, assets visuels
├── variant-output/       ← mockups HTML A/B/C (validés)
├── docs/                 ← documentation projet
├── site/                 ← VITRINE publique Next.js 16
│   └── src/...
└── mobile/               ← APP UNIQUE Expo / React Native
    └── src/...           (membres + admin gated by role, iOS + Android + web)
```

**Important — décision architecturale (2026-05-23)** :
- `site/` = vitrine publique (landing, pricing, blog, légal)
- `mobile/` = **app unique** qui tourne sur iOS, Android ET web (Expo support les 3). Contient :
  - Espace membre (visible pour tous les abonnés)
  - **Onglet Admin gated** par `user.app_metadata.role` (visible uniquement pour `admin` = Alex, `validator` = Julien). Permet la validation des pronos + publication. Utilisé en mobile pour validation rapide, en web (Mac, Chrome) pour rédaction longue.
- **Backend = Supabase Edge Functions** (Stripe webhook + cron agents IA). Pas de serveur Node séparé.
- Pas de Next.js admin séparé — supprimé le 2026-05-23 au profit d'une app unique multi-plateforme.

## Stack technique

**Vitrine (`site/`)** — DÉJÀ INSTALLÉ :
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- React Three Fiber + drei (pour effet hero 3D probablement)

**À installer dans `site/`** :
- shadcn/ui (composants UI)
- framer-motion (animations)
- lenis (smooth scroll si pertinent)
- @supabase/supabase-js (newsletter, contact, alertes inscription)

**Mobile (`mobile/`)** — déjà bootstrappé :
- Expo SDK 56 + Expo Router + React Native 0.85 + React 19
- Supabase (auth + LargeSecureStore pour la session chiffrée)
- **RevenueCat** (à brancher en Phase 2) — abstraction Apple IAP + Google Play Billing + Stripe web. ⚠️ Sur iOS, Stripe in-app est interdit pour les abos digitaux.
- Styling : `StyleSheet` + tokens (pas de NativeWind en v1)
- Cible web supportée (`npx expo start --web`) — pour usage admin sur Mac/clavier.

**Backend (Supabase Edge Functions)** — à monter :
- Webhook Stripe (paiements web)
- Webhook RevenueCat (paiements iOS + Android)
- Cron quotidien : collecte data API-Football
- Cron quotidien : analyse Claude API → propositions de paris
- Cron quotidien : tracking résultats matchs

**Déploiement** :
- Vitrine → serveurs internes DIGIFLOW (PAS Vercel)
- Mobile (iOS + Android) → **EAS Build** (Expo) → App Store + Google Play
- Mobile (web admin) → build statique Expo Web → sous-domaine `admin.ajpronos.fr`

---

## 🚨 RÈGLES INVIOLABLES — Conformité gambling

Ces règles sont **non négociables**. Toute violation = bloquant immédiat.

### 1. Outil IA interne — JAMAIS public
- L'outil Python + Claude API qui pré-analyse les données pour Julien est un **outil de productivité interne**.
- **JAMAIS** mentionner publiquement :
  - Pas dans le copy du site
  - Pas dans les commits sur le repo public
  - Pas dans la doc client
  - Pas dans les emails marketing
  - Pas dans les posts sociaux
- Communication publique = **expertise humaine + méthode rigoureuse + transparence ROI**. Point.

### 2. Mentions légales obligatoires sur TOUTES les pages
- "**+18**" visible (footer ou bandeau)
- Lien vers **`joueurs-info-service.fr`** (footer)
- "**Les paris sportifs comportent des risques**" (footer ou bannière)

### 3. Aucune promesse de gain
- ❌ "Gagnez tous les matchs", "100% gagnant", "ROI garanti", "argent facile"
- ❌ Présenter le service comme un revenu, un investissement, un placement
- ✅ "Nous publions tous nos pronostics, gains et pertes inclus", "transparence ROI", "méthode rigoureuse"

### 4. Sources de données = APIs publiques uniquement
- ✅ API-Football (autorisée)
- ✅ Autres APIs publiques avec licence claire
- ❌ **PAS de scraping** Pinnacle, Betfair, ou tout autre bookmaker
- ❌ Pas d'aspiration de cotes en temps réel non autorisée

### 5. Stripe désactivé tant qu'auto-entreprise pas immatriculée
- Le système de paiement Stripe doit être **bloqué côté code** tant qu'Alex n'a pas obtenu son numéro SIRET d'auto-entrepreneur.
- Tant que ce n'est pas fait : la page pricing peut exister, les boutons "S'abonner" peuvent exister, mais ils doivent rediriger vers une page **"Liste d'attente — ouverture imminente"** au lieu du checkout Stripe.

---

## Pricing validé (rappel rapide)

| Plan | Prix | Inclus |
|---|---|---|
| **Découverte** | Gratuit | 1 prono/jour foot |
| **Starter** | 9,90€/mois | Tous pronos foot + app + alertes |
| **Pro** | 24,90€/mois | Multi-sports + value bets + analyse détaillée |
| **VIP** | 59€/mois | Canal **WhatsApp Business** privé (50 places max) |
| À la carte | 4,90€ / 9,90€ | Ticket "gros match" / pack weekend |

**Canal VIP = WhatsApp Business uniquement.** PAS Telegram (refusé explicitement par Alex).

---

## État d'avancement & roadmap

### ✅ Fait
- Brief stratégique
- DA validée (palette crème #FAFAF7 + noir #0A0A0A + or #B8941F, typo Geist Sans + Mono)
- 4 mockups HTML générés (A/B/C + variant dark)
- Next.js 16 + R3F installé dans `site/`

### 🔄 En cours
- Conversion mockup HTML → Next.js dans `site/`

### 📋 À faire (vitrine)
- Pages : Accueil, Pricing, À propos (Alex + Julien), Méthode, Résultats publics, Contact, FAQ
- Pages légales : Mentions légales (auto-entreprise une fois immat), CGV, Politique confidentialité, Cookies
- Newsletter (Supabase)
- Bandeau gambling permanent
- Page "Liste d'attente" si Stripe pas encore activable
- Lancement `digiflow-pre-deploy-check` avant push prod

### 📋 À faire (app SaaS — phase ultérieure)
- Setup `app/` (Next.js séparé)
- Supabase Auth + RLS
- Stripe Checkout + Customer Portal (gating Découverte/Starter/Pro/VIP)
- Intégration canal VIP WhatsApp Business (manuelle au début, automatisée si volume)
- Dashboard pronostiqueur (Julien publie, Alex valide, mise en file pour publication)

---

## Spécificités projet à garder en tête

- **Différenciateur public = Alex et Julien expertise humaine.** Différenciateur interne = outil IA (jamais public).
- **Julien valide manuellement** chaque prono avant publication (l'IA propose, Julien dispose).
- **Audience cible** : 25-45 ans, mobile-first, qui parient "avec méthode" (pas au feeling).
- **Sensibilité forte** au sans-engagement et à la transparence ROI.
- **Tonalité site** : magazine éditorial premium (Substack premium, The Athletic, Apple marketing) — PAS "tech startup dark SaaS".

---

## Convention de commits (rappel)

Format `type(scope): description` en français.
Exemples :
- `feat(landing): hero section avec animation Three.js`
- `feat(pricing): table tarifs 4 plans avec CTA conditionnel`
- `fix(legal): bandeau +18 sticky sur toutes pages`
- `chore(deploy): pre-deploy check OK, push prod v1.0`

---

## En cas de doute

1. Relire `brief.md` (positionnement, audience, contraintes légales)
2. Relire `DESIGN.md` (DA validée, ne pas ré-improviser)
3. Vérifier les variantes HTML dans `variant-output/` pour la référence visuelle
4. Si conflit avec une règle DIGIFLOW client → c'est ce `CLAUDE.md` qui prime (on est sur AJ Pronos)
