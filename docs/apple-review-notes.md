# Apple Review Notes — AJ Pronos

> **Usage** : à copier-coller dans App Store Connect → version 1.0 → **App Review Information** → **Notes** lors de la première soumission iOS. Idem pour Google Play Console si demande similaire.
>
> **Objectif** : éviter un rejet Guideline 5.3 (Gambling) en démontrant qu'AJ Pronos est un service éditorial de conseil sportif, pas un opérateur de paris.

---

## 🎯 Notes à coller dans App Store Connect (en anglais)

```
=== ABOUT THIS APP — IMPORTANT REVIEW CONTEXT ===

AJ Pronos is an EDITORIAL SPORTS ADVISORY service. We do NOT operate
gambling, we do NOT take bets, and we do NOT process wagers. We are
an editorial publication providing sports analysis content — similar
in nature to The Athletic or Tipster AI / Rithmm (both approved on
the App Store).

LEGAL STATUS IN FRANCE
- We are NOT regulated by the ANJ (Autorité Nationale des Jeux —
  the French Gambling Authority), because sports advisory services
  are explicitly OUTSIDE its scope. Only gambling operators are.
- Our editor is a sole proprietor (auto-entrepreneur) registered
  under SIRET 105 467 542 00012 with NAF code 93.19Z
  ("Other sports-related activities"), legally distinct from
  gambling operator codes (92.00Z).
- All paid subscriptions go through Apple In-App Purchase
  (RevenueCat) on iOS — no external payment processor inside the
  app, no anti-steering, full compliance with Guideline 3.1.1.

WHAT THE APP DOES
- Publishes 1 to 3 sports betting tips per day (football + tennis)
  written by Julien Ruffin, our analyst (20 years of sports
  analysis experience).
- Each tip includes: match, predicted outcome, recommended stake,
  minimum acceptable odds, reasoning behind the pick, and tracked
  result after the match.
- Users see a public ROI dashboard tracking ALL tips (wins AND
  losses) for full transparency.
- VIP tier includes a private in-app chat with the analyst and
  weekly group video sessions.

WHAT THE APP DOES NOT DO
- Does NOT allow users to place bets.
- Does NOT redirect users to gambling operators (no affiliate
  links to bookmakers).
- Does NOT integrate any bookmaker's payment system.
- Does NOT process or store any payment details for gambling.

THE "AI INSIGHTS" FEATURE
We have an internal AI tool that pre-analyzes thousands of bet
combinations and surfaces value bets to our analyst. The AI is
PRESENTED AS A PRODUCTIVITY ASSISTANT, NEVER as an oracle. Every
single tip published has been MANUALLY VALIDATED by our human
analyst before publication. The marketing copy is explicit on
this point: "L'IA propose, Julien tranche" ("The AI proposes,
Julien decides"). This is similar in approach to BetSmart AI,
which Apple has approved.

RESPONSIBLE GAMBLING COMPLIANCE
- "+18 only" disclaimer is displayed on every page (footer +
  homepage + checkout).
- Link to "Joueurs Info Service" (French government helpline for
  problem gambling: joueurs-info-service.fr) on every page.
- Onboarding screen explicitly informs users that betting carries
  financial risk and addiction risk.
- No language promising profits ("get rich quick", "100 % winning
  strategy", etc.). On the contrary, our public results page
  displays both wins AND losses.

PRECEDENTS ON THE APP STORE
Comparable apps already approved:
- Rithmm (Bundle ID: com.rithmm.Rithmm) — sports betting tips
- Tipster AI — AI-assisted tipping
- BetSmart AI — AI sports analysis
- Action Network — sports betting analysis

EDITORIAL EXEMPTION CLAIM
This app falls under the same "editorial publication" exemption
Apple grants to sports analysis publications. We are publishing
editorial content (sports tips) the same way a newspaper publishes
match previews — only delivered via a digital subscription app.

=== DEMO ACCOUNT FOR REVIEW ===

Email:    apple-review@ajpronos.fr
Password: ApplReview2026!

This account has VIP tier access to all features (tips, AI Insights,
VIP chat, history, results). Please note the AI Insights screen
clearly shows that Julien validates each AI proposal before
publication.

=== CONTACT IF QUESTIONS ===

For any clarification during review, please contact:
- Email: contact@ajpronos.fr
- Response time: under 24h business days
- Editor: Julien Ruffin (sole proprietor, auto-entrepreneur)
- Website: https://ajpronos.fr (includes full legal mentions,
  terms of service, privacy policy)

Thank you for your time reviewing AJ Pronos.
```

---

## 📋 Notes en français (référence interne)

### Position défensive face à Apple Review

**Reject potentiel n°1 — Guideline 5.3 (Gambling)**
> *"Apps that facilitate real-money gambling must be geo-restricted to legal locations and have necessary licensing."*

**Réponse** :
- On n'est PAS un opérateur de paris : on conseille, on ne prend pas de mise
- On n'est PAS régulé par l'ANJ — uniquement les opérateurs le sont
- SIRET avec code NAF 93.19Z (autres activités sportives), pas 92.00Z (gambling)
- Précédents validés : Rithmm, Tipster AI, BetSmart AI, Action Network — tous des services de conseil sportif

**Reject potentiel n°2 — Guideline 3.1.1 (In-App Purchase)**
> *"Apps offering subscription services must use Apple's IAP for digital goods."*

**Réponse** :
- 100 % des paiements iOS passent par RevenueCat (qui utilise Apple IAP)
- Aucun lien externe vers le site pour souscrire (anti-steering Apple respecté)
- Le portail Stripe pour gérer son abo n'est accessible que via le **site web**, pas depuis l'app iOS

**Reject potentiel n°3 — Guideline 1.4.3 (Drug, Alcohol, Smoking, Gambling)**
> *"Apps that encourage minors to consume any of these substances will be rejected."*

**Réponse** :
- Mention "+18 only" sur **chaque page** (footer + bannière onboarding + écran checkout)
- Lien Joueurs Info Service sur chaque page
- Onboarding : écran dédié à la responsabilité (avant même le premier abonnement)
- Tracking d'âge à l'inscription possible si Apple le demande

---

## ✅ Checklist AVANT soumission

Avant de cliquer "Submit for Review", vérifier :

- [ ] **App Store Connect → App Information → Age Rating** : 17+ (avec "Frequent/Intense Mature/Suggestive Themes" + "Frequent/Intense Simulated Gambling")
- [ ] **App Store Connect → Pricing & Availability** : pays géo-restreints aux pays où le conseil pronos est légal (France + zone EU principalement, EXCLURE : USA states sans regulation explicite, Australia, certains pays Moyen-Orient)
- [ ] **App Store Connect → App Privacy** : déclaration des données collectées (email, paiement Apple, statistiques d'usage). Pas de tracking publicitaire.
- [ ] **App Store Connect → Content Rights** : pas de contenu tiers protégé
- [ ] **App Store Connect → App Review** :
  - [ ] Notes copiées-collées (bloc anglais ci-dessus)
  - [ ] Demo account créé (apple-review@ajpronos.fr) avec accès VIP
  - [ ] Contact email = contact@ajpronos.fr
  - [ ] Contact phone = numéro Julien
- [ ] **Captures écran** : 6 screenshots iPhone 6.9" déjà prêtes dans `docs/appstore-screenshots/`
- [ ] **Subtitle App Store** : "Pronostics sportifs · Méthode rigoureuse" (PAS "Gagne aux paris" ou autre claim de gain)
- [ ] **Description App Store** : reprendre `docs/app-store-listing.md` qui est déjà conforme
- [ ] **Mots-clés** : éviter "gambling", "betting" en mots-clés principaux. Privilégier "sports tips", "football analysis", "tennis predictions", "conseil paris"

---

## 🚨 Réponses pré-rédigées si Apple demande des clarifications

### Si Apple écrit : "We need to confirm this is not a gambling operator app"

**Copier-coller cette réponse** :

```
Thank you for the review. AJ Pronos is NOT a gambling operator.
We are an editorial sports advisory service, similar to apps like
Rithmm (com.rithmm.Rithmm), Tipster AI, and Action Network — all
approved on the App Store.

Specifically:
1. We do not take bets, hold money for bets, or process wagers.
2. We do not redirect to or affiliate with any bookmaker.
3. We publish editorial sports analysis content (paid daily tips
   written by our analyst).
4. Our French SIRET (105 467 542 00012) is registered under NAF
   code 93.19Z (Other sports-related activities), not 92.00Z
   (Gambling operators).
5. We are NOT regulated by the French Gambling Authority (ANJ),
   because sports advisory services fall outside its scope.

Please let us know if you'd like additional documentation
(business registration, terms of service, or a video demo).
```

### Si Apple écrit : "Please clarify how the AI feature works"

**Copier-coller** :

```
The AI Insights feature is an internal productivity tool, not an
oracle.

Our internal AI scans thousands of bet combinations and surfaces
value bets to our human analyst Julien. Every published tip is
MANUALLY VALIDATED by Julien before going live. The AI never
publishes anything autonomously.

Our marketing copy is explicit: "L'IA propose, Julien tranche"
("The AI proposes, Julien decides"). The AI Insights screen in
the app clearly shows the validation status of each AI proposal
(✓ Julien validated / ✗ Rejected by Julien / Currently being
reviewed).

This is comparable to BetSmart AI, which Apple has approved with
a similar AI-assisted-but-human-validated approach.
```

### Si Apple écrit : "Please add explicit responsible gambling messaging"

**Copier-coller** :

```
We agree this is critical. The app already includes:
- "+18 only" disclaimer on the homepage, footer, and checkout
- Link to "Joueurs Info Service" (joueurs-info-service.fr, the
  official French problem gambling helpline) on every page
- A dedicated onboarding screen warning users about financial
  and addiction risks BEFORE they can subscribe
- A public transparency dashboard displaying all our wins AND
  losses (no cherry-picked results)
- No language promising guaranteed gains anywhere in copy

If additional messaging is required, please let us know which
specific area you'd like reinforced.
```

---

## 📅 Timing prévisible

| Étape | Délai |
|---|---|
| Soumission depuis Xcode/EAS | T = 0 |
| App reçue par Apple Review queue | T + 24h |
| Review humaine en cours | T + 24-72h (souvent 48h) |
| Décision : **Approved** | T + 48-96h ✅ |
| Décision : **Rejected** + raison | T + 48-72h ⚠️ |

**Si rejected** :
1. Lire attentivement la guideline citée
2. Adapter le code OU les notes selon le cas
3. Re-soumettre avec un message expliquant ce qui a été changé
4. Compter 5-7 jours par cycle de re-soumission

**Ma reco** : soumettre un **lundi matin (heure US Pacific)** pour avoir un cycle complet dans la semaine.

---

## 🎓 Précédents utiles à citer

| App | Bundle ID | Pourquoi citer |
|---|---|---|
| **Rithmm** | com.rithmm.Rithmm | App de pronos sportifs validée par Apple, modèle proche |
| **Tipster AI** | — | Pronos assistés par IA, validée |
| **BetSmart AI** | — | IA + analyse humaine validée |
| **Action Network** | com.actionnetwork.actionnetwork | Analyse de paris pro |
| **The Athletic** | com.theathletic.theathletic | Service éditorial sportif premium |

---

## 🔐 Préparation compte demo (à faire J-1 de la soumission)

1. Créer compte `apple-review@ajpronos.fr` côté Supabase Auth
2. Lui attribuer le rôle **VIP** dans `profiles` (manuellement via SQL)
3. Donner accès à toutes les fonctionnalités VIP :
   - Tous les pronos visibles
   - Salon VIP avec quelques messages d'exemple
   - Historique tipsters avec ROI
4. Vérifier que le compte fonctionne en se connectant depuis l'app
5. Noter le mot de passe dans le mockup ci-dessus (à régénérer le jour J)

```sql
-- À exécuter dans Supabase SQL Editor le jour J
UPDATE profiles
SET tier = 'vip',
    subscription_status = 'active',
    current_period_end = (now() + interval '1 year')
WHERE id = (SELECT id FROM auth.users WHERE email = 'apple-review@ajpronos.fr');
```

---

**Dernière mise à jour** : 12 juin 2026
**Auteur** : préparé en interne avant la propagation worldbase DUNS (en attente).
