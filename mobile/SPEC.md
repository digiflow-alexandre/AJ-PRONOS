# AJ Pronos — Spécifications fonctionnelles (SPEC.md)

> **Document de référence** pour le développement de l'app mobile AJ Pronos.
> Toute session de dev future doit s'y référer. À mettre à jour quand on change d'avis.
>
> **Dernière mise à jour** : 2026-06-01
> **Version** : 0.3 (deadline ferme 5 jan 2027, captures bookmaker, agents IA sports V2, feedback board V2)

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

**Objectif** : sortir une app utilisable, sur l'App Store **ET** le Google Play Store, avec ses premiers abonnés payants.

**🚨 DEADLINE FERME : 11 juin 2026** (corrigée 1er juin — Alex avait initialement noté 5 janvier 2027 puis 5 juin par erreur).

**"Disponible le 11 juin" = app live sur Apple Store ce jour-là.** Google Play Store = V1.5 ultérieure (focus iOS pour tenir la deadline).

**Pré-requis déjà ok** : SIRET Alex obtenu.

**Sprint imposé : ~10 jours.** Implications :
- Soumission App Store **le 7 juin au plus tard** pour avoir 4 jours de buffer Apple review (gambling-adjacent = souvent 3-5 jours)
- Descope agressif de V1 : voir liste MUST HAVE vs V1.1 dans memory `deadline-mvp-v1.md`
- Compte Apple Developer + RevenueCat doivent être ACTIFS d'ici fin de semaine
- Carnet perso, salon VIP, push, captures bookmaker, agents IA backend, popup bilan → tout **V1.1** ou plus tard

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
- `bookmaker_screenshot_url` (capture d'écran du ticket réel posé par Julien — cf. section 4bis "Capture du pari réel")
- `bookmaker_name` (Winamax / Unibet / Betclic / etc — pour la légende sous la capture)
- `published_at`, `published_by`

**Storage** : bucket public Supabase `bet-screenshots` (admins write, tous read). Compression côté upload via `expo-image-manipulator` (cible <200 Ko).

#### Agents IA / cron MVP

- **Agent 1 — Collecte** (cron 2×/jour) : pull matchs J/J+1 → `matches`
- **Agent 2 — Analyste** (cron quotidien matin) : pour chaque match, contexte + Claude API → `ai_proposals`
- **Agent 3 — Tracking résultats** (cron quotidien soir J+1) : pull résultats → update `bet_results`
- **Webhook Stripe** (post-SIRET) : sync abonnement web
- **Webhook RevenueCat** : sync abonnement iOS + Android

#### Out of MVP V1 (rappels)

- ❌ Pas de tracking paris externes (Phase 3 — risque juridique)
- ❌ Pas de stats avancées par sport/compétition (Phase 2)
- ❌ Pas de chat IA assistant VIP (MVP V2)
- ❌ Pas de demande IA on-demand sur match précis (MVP V2)
- ❌ Pas de communauté ouverte (Phase 3 — sauf salon VIP qui est MVP V1)

**Le carnet personnel est désormais MVP V1** (validé visio Julien — accessible à tous les packs y compris Starter).

---

### PHASE 2 (MVP V2) — Post-lancement (1-2 mois après MVP V1)

**Objectif** : enrichir l'expérience abonné, augmenter la rétention, donner plus d'arguments pour upgrade.

- **Chat IA assistant VIP** — assistant Claude explicite (réponses questions générales, escalade vers Julien sur complexité)
- **Demande IA on-demand** — abonné Pro/VIP demande analyse IA sur match non couvert (avec garde-fous ANJ — cf. section 4bis)
- **Agents IA spécialisés sports non-foot/tennis** (basket NBA/EuroLeague, rugby Top 14/6 Nations, hockey NHL) — Julien ne couvre que foot+tennis (sa zone d'expertise). Pour étendre l'offre sans diluer la promesse expertise humaine, on lance des **agents IA spécialisés par sport** qui proposent les pronos avec disclaimer EXPLICITE : *"Pronostic généré par IA spécialisée [sport], non validé par notre analyste humain"*. Tarification : à arbitrer (option add-on payant ?). Contraintes ANJ identiques à la demande IA on-demand (cf. section 4bis garde-fous).
- **Système feedback / suggestions communauté** — module in-app où les abonnés proposent des améliorations : ex *"il manque telle stat sur la fiche pari", "j'aimerais une notif quand cote > X"*. Format type Canny/Featurebase simplifié : formulaire d'idée + vote upvote + statut (À étudier / En cours / Livré). Dashboard admin pour Alex/Julien (lecture + statut). Pourquoi : capter le besoin terrain plutôt que de deviner les features V3.
- **Stats avancées** : performance par sport, par compétition, par période, courbes ROI
- **Filtres avancés** sur la liste pronos (sport, risque, type de pari, cote)
- **Notifs personnalisées par préférences** (sport spécifique, seuil de cote, etc.)
- **Onboarding amélioré** avec teaser interactif des pronos floutés
- **Dashboard admin avancé** : nb abonnés par tier, conversion, churn, top VIP, alertes comportement à risque
- **Outil de modération salon VIP** : suspendre user, supprimer messages
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

## 4 bis. Décisions visio Julien (2026-05-30) — CONTENU PACKS & SALON VIP

### Contenu des packs (refonte)

**Important** : Toutes les fonctionnalités de base (analyse, ROI, carnet personnel) sont **accessibles à tous les packs**. La différenciation se joue sur le **nombre de pronos quotidiens** + l'**accès au salon VIP**.

| Pack | Pronos humains/jour (Julien) | Pronos IA/jour (Julien-validés) | Analyse | Carnet perso | ROI | Salon |
|---|---|---|---|---|---|---|
| **Starter** 9,90€ | **1** (foot OU tennis) | 0 | ✓ complète | ✓ | ✓ | — |
| **Pro** 19,90€ | **2** | **1** (combiné OU simple, généré par IA, validé par Julien) | ✓ complète | ✓ | ✓ | — |
| **VIP** 49,90€ | **2** | **1** | ✓ complète | ✓ | ✓ | ✓ |

**Cadence de publication** :
- **Foot** : publié **1h avant le coup d'envoi**
- **Tennis** : publié la veille OU le jour J (matin/soir selon heure du match)
- → **Push notifications obligatoires** au MVP V1

**Couverture sportive** :
- Foot : 5 grands championnats européens (Ligue 1, La Liga, Premier League, Bundesliga, Serie A) + UEFA (Champions League, Europa League)
- Été : compétitions UEFA officielles (Mondial, Euro, Ligue des Nations, Copa America)
- Tennis : tous les tournois ATP officiels

### Volumétrie / cadence

- **2-3 pronos par jour** publiés en moyenne (mix combinés + simples)
- **Mix combinés/simples** au feeling Julien selon opportunités du jour

### Workflow validation IA → Julien (mode admin)

- L'agent IA propose chaque matin des **propositions par sélection** (pas par lot combiné complet)
- Julien construit ses combinés lui-même en piquant les sélections IA qu'il valide
- **Temps moyen estimé : 10 min/prono = 30 min/jour**
- Backup Alex si Julien indisponible (rôle `admin` qui peut aussi valider)

### Salon VIP (architecture)

- **Salon de groupe** : tous les VIP + admins (Alex, Julien) parlent ensemble
- Objectif : partager pronos, donner avis/suggestions, échanger entre passionnés
- **PAS de DM entre VIP** (risque modération LCEN + escroquerie inter-utilisateurs)
- **VIP peut demander un coaching privé à Julien** : bouton dans le salon → ouvre fil privé Julien ↔ VIP uniquement
- **Modération obligatoire** : Alex et Julien ont le pouvoir admin (supprimer message, kick, bannir)
- Tech : Supabase Realtime (channel par salon VIP, table `vip_messages`)

### Présentation du "pari IA" côté utilisateur

- Sur l'app : on affiche **"Pari IA proposé à Julien et validé par lui"** (transparence assumée)
- Cohérent avec la règle inviolable "outil IA jamais public" → ici on dit IA mais on dit aussi "validé par Julien" donc la promesse expertise humaine reste intacte
- Le pari IA reste un pari complet avec analyse Julien, indice de confiance, etc.

### Capture du pari réel (preuve "Julien joue vraiment") — MVP V1

Chaque prono affiché dans l'app doit montrer la **capture d'écran du pari réel** posé par Julien sur son compte bookmaker (Winamax / Unibet / Betclic / etc).

**Pourquoi** : différenciateur fort vs tipsters classiques qui publient juste du texte. Avec la capture, Julien prouve qu'il met son propre argent en jeu → renforce la transparence ROI et le positionnement "expertise humaine + transparence".

**Format** :
- Hero de la fiche pari = la capture d'écran du ticket bookmaker
- Sous la capture = l'analyse Julien (carnet, ROI, contexte)
- Sur les cards de liste = thumbnail compressée de la capture (en accent visuel)

**Anonymisation obligatoire** :
- Pas de solde de compte visible
- Pas de username/email visible si exposé sur le ticket
- Julien doit flouter manuellement avant upload OU utiliser un compte dédié sans identifiants

**Pas de partenariat affiché** : on montre la capture parce que c'est la réalité, mais on n'écrit JAMAIS "partenaire Winamax" tant qu'on n'a pas signé un programme d'affiliation officiel et déclaré l'activité d'apporteur d'affaires (ANJ).

### Méthode IA — construction du prompt système

L'agent IA (Claude API) qui propose les paris quotidiens est construit en **2 phases successives** :

1. **Phase 1 — Base Alex + Claude** (à faire au début) : on construit un prompt système initial avec une méthode d'analyse "raisonnable" basée sur les bonnes pratiques générales du pari sportif (forme récente, H2H, blessures, contexte, value bet). Cette base est mise en production pour générer les premières propositions.
2. **Phase 2 — Enrichissement méthode Julien** : Julien teste les propositions, identifie les manques et biais, et on enrichit progressivement le prompt avec **sa méthode personnelle** (critères propres, seuils, signaux spécifiques qu'il regarde). Itératif sur plusieurs semaines.

**Pourquoi cette approche** : on ne peut pas extraire d'un coup toute la méthode Julien (20 ans d'expérience implicites, difficiles à verbaliser). Mais on peut démarrer avec un baseline correct et l'affiner via le feedback de validation/rejet de Julien sur les propositions réelles.

**Tech** : prompt système stocké en config Supabase (table `ai_config`, version sémantique). Chaque proposition log la version du prompt utilisée pour faire de l'analyse de qualité par version.

### Chat IA assistant VIP — **REPORTÉ MVP V2**

- Pas implémenté au MVP V1 (chantier 2-3 semaines de dev backend dédié)
- Sera ajouté dans la version V2 (1-2 mois après lancement)
- Specs à venir : assistant Claude API explicitement annoncé "Assistant IA", garde-fous (jamais de pronostic, escalade vers Julien sur questions complexes)

### Feature "Demande IA on-demand" — **REPORTÉ MVP V2**

Concept : abonné Pro/VIP peut demander à l'IA une analyse de pari sur un match spécifique non couvert par Julien.

**Garde-fous obligatoires (à respecter quand on l'implémente)** :
1. **Disclaimer FORT** avant chaque réponse IA : *"Cette suggestion est générée par IA, non validée par notre analyste, et ne constitue pas une garantie de gain"*
2. **Limite quotidienne** : max 3 demandes IA/jour par utilisateur (coût Claude + abus)
3. **Liste matchs autorisés** : uniquement 5 grandes ligues + UEFA + ATP
4. **Pas de mise recommandée** dans la réponse IA
5. **Logs systématiques** de chaque demande (cas litige ANJ)

**Tech** :
- Backend récupère data API-Football (forme, H2H, blessures, classement) + cotes via OddsAPI
- Prompt système "méthode Julien" co-écrit avec lui
- Cache 30 min sur les réponses (éviter 2 users qui demandent même match)
- Setup OddsAPI (~60€/mois en plus d'API-Football)

**Coût Claude estimé** : ~50 USD/mois à 250 abonnés actifs. Acceptable.

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

1. **L'outil IA backend (Claude) est JAMAIS public.** L'utilisateur ne voit que "validé par notre analyste". **Exception assumée** (validée visio Julien 2026-05-30) : on peut afficher *"Pari IA proposé à Julien et validé par lui"* sur le 3ème prono quotidien des packs Pro et VIP. Cohérent parce que tout passe par Julien.
2. **+18 + lien `joueurs-info-service.fr`** visible sur toutes les pages.
3. **Aucune promesse de gain.** Vocabulaire : "pronostic", "recommandation", JAMAIS "gain garanti".
4. **Sources data autorisées uniquement** : API-Football + APIs publiques. PAS de scraping bookmakers.
5. **Stripe activé UNIQUEMENT après SIRET Alex.** Avant : redirection liste d'attente.
6. **Sur iOS** : Apple IAP obligatoire pour abos digitaux. Stripe interdit in-app.
7. **PAS de DM entre abonnés** (risque modération LCEN + arnaques). Salon VIP = groupe uniquement, coaching privé Julien ↔ VIP autorisé.

---

## 7. Conformité ANJ + Apple (à creuser avant lancement)

- **Statut juridique** : "conseil en paris sportifs", PAS opérateur. Auto-entreprise Alex à immatriculer en conseil.
- **Catégorie App Store** : Sports ou Lifestyle (pas Gambling) — à valider à la review.
- **Classement 17+** sur les stores.
- **Avertissement obligatoire** : "Les performances passées ne préjugent pas des performances futures" sur les écrans stats.
- **Outils jeu responsable** : limite quotidienne de notifs, suggestion de pause si comportement compulsif détecté.
- **Validation juridique avant Phase 3** sur le carnet paris externes (zone grise).

---

## 8. État d'avancement actuel (au 2026-06-01)

### ✅ Fait (MVP V1)

- Login + Signup avec auth Supabase (LargeSecureStore)
- Gating routes via `Stack.Protected` Expo Router
- Splash animé avec slide du logo vers le header login
- BrandHeader réutilisable (logo + bell + account) sur tous les écrans (app)
- Sheets Compte + Notifications (placeholders)
- Onglet bas avec 3 tabs (Accueil + Pronos + Abonnement)
- Écran Accueil : bilan 7j + 2-3 pronos du jour + bannière trial + bannière trial expired + modal trial expired
- Écran Abonnement avec 3 cards (frames PNG style FUT) + toggle mensuel/annuel + modal liste d'attente
- Trial expired + restriction essai 7j au pack Starter
- Schéma Supabase `profiles` + RLS + trigger signup + backfill
- Hook `useProfile()` avec Realtime + démarrage essai + isTrialExpired + canAccess gating
- Constantes packs (Starter 9,90 / Pro 19,90 / VIP 49,90 + annuel -20%)
- Support combinés : types ComboBet + Selection, ComboBetCard, ComboBetDetail, 98 historiques + selections mockées par PRNG seedé
- Stats Center foot (Forme / Saison / Classement) avec logos
- Stats Center tennis (Profil comparatif / Forme groupée par tournoi avec sub-chips surface / Tableau placeholder)
- Picker de mois pour naviguer dans l'historique
- Filtres status (Tous / Live / Gagnés / Perdus) conditionnels sur l'onglet Pronos
- Filet coloré par compétition sur cards prono simple, doré sur cards combinés
- Logo corrigé : "AJ PRONOS" (avec S), format portrait 928×1152, fond transparent

### 🚧 À faire (MVP V1, par ordre logique)

1. **Popup bilan résultats** (modal à l'ouverture si paris résolus depuis dernière visite — phrase sobre Julien ANJ-compliant)
2. **Capture du pari réel** (storage Supabase + upload admin Julien + affichage hero fiche pari + thumbnail card)
3. **Carnet personnel** (marquer un prono comme joué + stats perso + ROI réel)
4. **Onboarding complet** (7 écrans : welcome → +18 → sports → risque → notifs → essai)
5. **Page Stats AJ Pronos** (ROI global, performance par mois)
6. **Sheet Préférences notifs**
7. **Sheet Mentions légales + jeu responsable**
8. **Salon VIP** (chat groupe Supabase Realtime + bouton "Coaching Julien")
9. **Push notifications** Expo Notifications (foot 1h avant, tennis veille/jour J)
10. **Admin app** (file propositions IA par sélection + builder combiné + queue publication, upload screenshot pari)
11. **Backend Supabase Edge Functions** (agents IA cron + API-Football + tracking résultats)
12. **Connexions APIs externes** (API-Football, OddsAPI manuel V1 → automatique post-100 abonnés)
13. **RevenueCat** (après SIRET Alex)
14. **EAS Build** + submission App Store + Google Play (deadline 5 jan 2027)

### 🚧 À faire (MVP V2, post-lancement)

- Chat IA assistant VIP (Claude API + escalade Julien)
- Demande IA on-demand (avec garde-fous ANJ stricts)
- **Agents IA spécialisés basket / rugby / hockey** (zones non couvertes par Julien — disclaimer fort)
- **Système feedback / suggestions communauté** (in-app, type Canny simplifié)

---

## 9. Décisions ouvertes (à valider en cours de route)

- **Onboarding** : skip possible des étapes 3-5 ou obligatoire ?
- **Sports MVP V1** : foot + tennis (acté — basket/rugby/hockey via agents IA spécialisés en V2)
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
