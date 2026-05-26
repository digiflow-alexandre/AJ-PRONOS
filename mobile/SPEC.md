# AJ Pronos — Spécifications fonctionnelles (SPEC.md)

> **Document de référence** pour le développement de l'app mobile AJ Pronos.
> Toute session de dev future doit s'y référer. À mettre à jour quand on change d'avis.
>
> **Dernière mise à jour** : 2026-05-26
> **Version** : 0.1 (initiale)

---

## 1. Vision en 3 phrases

AJ Pronos est un **cabinet de conseil en paris sportifs** sous forme d'app mobile native. Les abonnés reçoivent chaque jour des pronostics validés à la main par un analyste humain (Julien), avec un argumentaire détaillé. La promesse n'est pas le gain — c'est la **méthode rigoureuse, la transparence totale (gains ET pertes publiés) et le partage d'expertise**.

---

## 2. Personas

| Persona | Qui | Ce qu'il fait dans l'app |
|---|---|---|
| **Abonné gratuit** | Nouvel utilisateur en essai 7j ou ex-payant en grâce | Découvre la méthode, voit quelques pronos en lecture, consulte les stats publiques |
| **Abonné payant** | Starter / Pro / VIP | Consulte les pronos selon son tier, marque ceux qu'il a joués, suit son ROI personnel |
| **Julien** (validator) | Analyste paris | Voit les propositions de l'agent IA, les modifie/valide/rejette, ajoute son argumentaire |
| **Alex** (admin) | Co-fondateur | Voit les pronos validés par Julien, choisit le moment de publication, pousse aux abonnés |
| **Agents IA** (system) | Cron jobs Supabase | Collecte data, analyse matchs via Claude API, track les résultats — invisibles pour l'utilisateur |

---

## 3. Architecture technique (rappel)

- **Mobile** : Expo SDK 56 + Expo Router + React Native + TypeScript
- **Backend** : Supabase (auth + Postgres + Realtime + Edge Functions)
- **Paiement** : Apple IAP + Google Play Billing via **RevenueCat** (Phase 2, après SIRET d'Alex)
- **IA** : Claude API (côté serveur uniquement, jamais exposé dans l'app)
- **Data sport** : API-Football (RapidAPI)
- **Notifs** : Expo Notifications + Supabase trigger
- **Vitrine web** : Next.js séparé (`../site/`)

---

## 4. Roadmap

### PHASE — MVP v1 (lancement public)

**Objectif** : sortir une app utilisable, sur l'App Store, avec ses premiers abonnés payants.
**Cible** : 4-6 semaines de dev après validation de ce SPEC.

#### User stories — Abonné

- En tant que **nouvel utilisateur**, je veux **m'inscrire** rapidement (email + mdp) et confirmer mes 18 ans.
- En tant que **nouvel utilisateur**, je veux **un tunnel d'onboarding** qui me demande mes préférences (sports, niveau de risque, notifs) en 1 minute.
- En tant que **nouvel utilisateur**, je veux **démarrer un essai gratuit 7 jours** sans CB.
- En tant qu'**abonné**, je veux **voir le dashboard du jour** dès l'ouverture (pronos disponibles + bilan récent + matchs à venir).
- En tant qu'**abonné**, je veux **consulter la liste des pronos** classés par sport / compétition / heure.
- En tant qu'**abonné**, je veux **lire la fiche détaillée d'un prono** avec l'argumentaire complet de Julien (forme, confrontations, stats, blessures, indice de confiance).
- En tant qu'**abonné**, je veux **consulter les pronos de la veille** et leur résultat (gagnant / perdant).
- En tant qu'**abonné**, je veux **voir les stats globales AJ Pronos** : taux de réussite, ROI théorique, nb de pronos.
- En tant qu'**abonné**, je veux **gérer mon abonnement** (voir mon pack, le changer, le résilier).
- En tant qu'**abonné en fin d'essai**, je veux **être prévenu et orienté** vers le choix d'un pack avant expiration.
- En tant qu'**abonné**, je veux **activer/désactiver mes notifications** depuis mon profil.

#### User stories — Admin (Julien + Alex)

- En tant que **Julien**, je veux **voir la file des propositions IA** en attente.
- En tant que **Julien**, je veux **modifier / enrichir / rejeter** une proposition avant validation.
- En tant que **Julien**, je veux **valider** un prono → il passe dans la file "à publier" d'Alex.
- En tant qu'**Alex**, je veux **voir la file des pronos à publier**.
- En tant qu'**Alex**, je veux **publier** un prono → il devient visible pour les abonnés du bon tier, notif push envoyée.

#### Écrans MVP

| Groupe | Écran | Description |
|---|---|---|
| **Auth** | `/(auth)/sign-in` | Login email + mdp ✅ (existe) |
| **Auth** | `/(auth)/sign-up` | Inscription email + mdp ✅ (existe) |
| **Onboarding** | `/(onboarding)/welcome` | Splash welcome avec valeur prop |
| **Onboarding** | `/(onboarding)/age-check` | Confirmation +18 ans (obligatoire) |
| **Onboarding** | `/(onboarding)/sports` | Multi-select des sports suivis |
| **Onboarding** | `/(onboarding)/risk-level` | Slider niveau de risque (safe / équilibré / agressif) |
| **Onboarding** | `/(onboarding)/notifications` | Permission push iOS |
| **Onboarding** | `/(onboarding)/start-trial` | Démarrage essai gratuit 7j |
| **App** | `/(app)/index` (Accueil) | Dashboard du matin ✅ (existe, à enrichir) |
| **App** | `/(app)/pronos` | Liste des pronos du jour + filtres |
| **App** | `/(app)/pronos/[id]` | Fiche détaillée d'un prono |
| **App** | `/(app)/history` | Pronos de la veille + historique + résultats |
| **App** | `/(app)/stats` | Stats globales AJ Pronos (ROI, taux, nb) |
| **App** | `/(app)/subscribe` | Choix / gestion du pack ✅ (existe, à enrichir) |
| **App** | `/(app)/subscribe/trial-expired` | Écran "essai terminé, choisis ton pack" |
| **App** | Sheet **Compte** | Email, tier, déconnexion, paramètres ✅ (existe) |
| **App** | Sheet **Notifications** | Liste des notifs reçues ✅ (existe, à enrichir) |
| **App** | Sheet **Préférences notifs** | On/off par type de notif |
| **App** | Sheet **Mentions légales** | CGU, mentions, jeu responsable, lien joueurs-info-service |
| **Admin** | `/(admin)/proposals` | File des propositions IA à valider (Julien) |
| **Admin** | `/(admin)/proposals/[id]` | Édition / validation d'une proposition |
| **Admin** | `/(admin)/queue` | File des pronos validés à publier (Alex) |
| **Admin** | `/(admin)/queue/[id]` | Publication d'un prono |

#### Modèle de données Supabase MVP

| Table | Description |
|---|---|
| `auth.users` | Géré par Supabase Auth |
| `profiles` ✅ | Tier, dates essai, role (`user` / `validator` / `admin`) |
| `matches` | Matchs collectés depuis API-Football |
| `ai_proposals` | Propositions générées par Claude, en attente validation Julien |
| `validated_bets` | Pronos validés par Julien, en attente publication Alex |
| `published_bets` | Pronos publiés, visibles abonnés selon `min_tier` |
| `bet_results` | Résultat de chaque pronostic (win / loss / push) après le match |
| `notifications` | Log des notifs envoyées (audit) |
| `user_notification_preferences` | Toggles utilisateur par type de notif |

**Champs critiques sur `published_bets`** :
- `min_tier` (starter / pro / vip) — quel pack minimum pour voir le prono
- `sport`, `competition`, `match_start_at`
- `prediction` (le pari proposé)
- `odd` (cote)
- `confidence` (indice 1-5)
- `reasoning` (l'argumentaire de Julien, texte long)
- `published_at`, `published_by`

#### Agents IA / cron MVP

- **Agent 1 — Collecte** (cron 2×/jour) : pull matchs J/J+1 → `matches`
- **Agent 2 — Analyste** (cron quotidien matin) : pour chaque match, contexte + Claude API → `ai_proposals`
- **Agent 3 — Tracking résultats** (cron quotidien soir J+1) : pull résultats → update `bet_results`
- **Webhook Stripe** (post-SIRET) : sync abonnement web
- **Webhook RevenueCat** : sync abonnement iOS + Android

#### Out of MVP (rappels)

- ❌ Pas de carnet personnel (Phase 2)
- ❌ Pas de tracking paris externes (Phase 3 — risque juridique)
- ❌ Pas de combinés suggérés (Phase 2)
- ❌ Pas de stats avancées par sport/compétition (Phase 2)
- ❌ Pas de communauté (Phase 3)

---

### PHASE 2 — Post-lancement (2-3 mois après MVP)

**Objectif** : enrichir l'expérience abonné, augmenter la rétention, donner plus d'arguments pour upgrade.

- **Carnet personnel** — marquer un prono "je l'ai joué" + saisie mise réelle + ses propres stats (gains/pertes/ROI réel) — **uniquement sur les pronos AJ Pronos** pour l'instant
- **Combinés suggérés** par l'analyste
- **Stats avancées** : performance par sport, par compétition, par période, courbes ROI
- **Filtres avancés** sur la liste pronos (sport, risque, type de pari, cote)
- **Notifs personnalisées par préférences** (sport spécifique, seuil de cote, etc.)
- **Onboarding amélioré** avec teaser interactif des pronos floutés
- **Dashboard admin avancé** : nb abonnés par tier, conversion, churn, top VIP, alertes comportement à risque
- **Outil de modération** : message direct à un user, suspension temporaire
- **Support in-app** : chat ou ticket vers email

---

### PHASE 3 — Plus tard (à valider juridiquement avant)

- **Carnet paris externes** (Winamax, Unibet…) — **bloquant : validation juridique requise**
- **Suivi live des matchs** (scores temps réel via API-Football webhooks)
- **Volet communautaire** : commentaires sur les pronos, classement utilisateurs, partage
- **Système de fidélité** : badges, niveaux, anniversaire d'abonnement
- **Promotions / codes promo** sur les abos
- **Extension multi-langues** (anglais ?)

---

## 5. Tunnel onboarding détaillé (MVP)

Au premier lancement après inscription :

```
[1] Welcome
    ├─ Logo + tagline "Le pari sportif avec méthode."
    └─ Bouton "Commencer"
    
[2] Vérification d'âge — OBLIGATOIRE
    ├─ "Tu dois avoir 18 ans ou plus pour utiliser l'app."
    ├─ Case à cocher "Je confirme avoir 18 ans ou plus"
    └─ Bouton "Continuer" (désactivé tant que pas cochée)
    
[3] Sports suivis
    ├─ "Quels sports te suivent ?"
    ├─ Multi-select : Football, Tennis (+ futurs sports désactivés)
    └─ Bouton "Continuer" (au moins 1 sélectionné)
    
[4] Niveau de risque
    ├─ "Quelle est ton approche du pari ?"
    ├─ Slider : Prudent · Équilibré · Audacieux
    └─ Bouton "Continuer"
    
[5] Notifications (system iOS prompt)
    ├─ "On te prévient à chaque nouveau prono ?"
    ├─ Bouton "Activer les notifs" → prompt iOS natif
    └─ Bouton "Plus tard" (skip)
    
[6] Essai gratuit
    ├─ "7 jours offerts pour tester sans engagement."
    ├─ Bouton "Démarrer mon essai 7 jours"
    └─ Bouton "Voir d'abord les packs" → écran abonnement
    
[7] → Bascule sur (app)/index
```

---

## 6. Règles métier inviolables (rappel CLAUDE.md projet)

1. **L'outil IA est JAMAIS public.** L'utilisateur ne voit que "validé par notre analyste".
2. **+18 + lien `joueurs-info-service.fr`** visible sur toutes les pages.
3. **Aucune promesse de gain.** Vocabulaire : "pronostic", "recommandation", JAMAIS "gain garanti".
4. **Sources data autorisées uniquement** : API-Football + APIs publiques. PAS de scraping bookmakers.
5. **Stripe activé UNIQUEMENT après SIRET Alex.** Avant : redirection liste d'attente.
6. **Sur iOS** : Apple IAP obligatoire pour abos digitaux. Stripe interdit in-app.

---

## 7. Conformité ANJ + Apple (à creuser avant lancement)

- **Statut juridique** : "conseil en paris sportifs", PAS opérateur. Auto-entreprise Alex à immatriculer en conseil.
- **Catégorie App Store** : Sports ou Lifestyle (pas Gambling) — à valider à la review.
- **Classement 17+** sur les stores.
- **Avertissement obligatoire** : "Les performances passées ne préjugent pas des performances futures" sur les écrans stats.
- **Outils jeu responsable** : limite quotidienne de notifs, suggestion de pause si comportement compulsif détecté.
- **Validation juridique avant Phase 3** sur le carnet paris externes (zone grise).

---

## 8. État d'avancement actuel (au 2026-05-26)

### ✅ Fait

- Login + Signup avec auth Supabase
- Gating routes via `Stack.Protected` Expo Router
- Splash animé avec slide du logo vers le header login
- BrandHeader réutilisable (logo + bell + account) sur tous les écrans (app)
- Sheets Compte + Notifications (placeholders)
- Onglet bas avec 3 tabs (Accueil + Pronos + Abonnement)
- Écran Accueil basique avec bannière essai gratuit
- Écran Abonnement avec 3 cards (frames PNG style FUT) + toggle mensuel/annuel + modal liste d'attente
- Schéma Supabase `profiles` + RLS + trigger signup + backfill
- Hook `useProfile()` avec Realtime + démarrage essai
- Constantes packs (Starter 9,90 / Pro 19,90 / VIP 49,90 + annuel -20%)

### 🚧 À faire (MVP, par ordre logique)

1. **Onboarding complet** (7 écrans détaillés ci-dessus)
2. **Page Pronos** + fiche détaillée
3. **Page Stats** AJ Pronos
4. **Page Historique** + résultats
5. **Écran Trial expired**
6. **Sheet Préférences notifs**
7. **Sheet Mentions légales + jeu responsable**
8. **Admin** : files Propositions + Queue + édition prono
9. **Agents IA Supabase Edge Functions** (collecte, analyse, tracking)
10. **Notifs push** (Expo Notifications + Supabase trigger)
11. **RevenueCat** (après SIRET)
12. **EAS Build** + submission stores

---

## 9. Décisions ouvertes (à valider en cours de route)

- **Onboarding** : skip possible des étapes 3-5 ou obligatoire ?
- **Sports MVP** : foot + tennis seulement ? ou ajout basket ?
- **Niveau de risque** : 3 ou 5 niveaux ?
- **Push notifs** : heures de coupure (pas après 22h) ?
- **Tunnel essai expiré** : grâce de 24h en lecture limitée ou bascule immédiate ?
- **Support client MVP** : email simple ou ticket in-app ?
- **Stats sur Accueil** : période par défaut (7 jours / 30 jours / depuis inscription) ?

---

## 10. Glossaire

- **Pack** = niveau d'abonnement (Starter / Pro / VIP)
- **Tier** = identifiant technique du pack (`starter` / `pro` / `vip` / `trial`)
- **Prono** = pronostic = paris recommandé par l'analyste
- **Proposition IA** = suggestion Claude API en attente de validation Julien
- **Pari validé** = proposition modifiée et acceptée par Julien, en attente publication
- **Pari publié** = pari visible aux abonnés du bon tier dans l'app
- **Carnet personnel** = espace privé de l'utilisateur où il note ses paris réels
