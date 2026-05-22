# AJ Pronos — Brief projet

**Date** : 2026-05-12
**Statut** : Pré-lancement, en attente d'auto-entreprise + logo

## Projet
Service de conseil en paris sportifs (FR). Deux co-fondateurs : **Alex** (dev/produit) et **Julien** (pronostiqueur expert, 10 ans d'expérience).

**Différenciateur public (site, marketing)** : expertise humaine + méthode rigoureuse + transparence ROI. Alex et Julien analysent manuellement compos, blessés, forme, head-to-head, value bets.

**Différenciateur interne (NE PAS communiquer)** : outil IA (Python + Claude API) qui pré-analyse les données et accélère le travail de Julien. Outil de productivité interne, jamais mentionné côté client. Décision stratégique : on met en avant l'humain, pas l'algo.

## Audience
Parieurs FR 25-45 ans, mobile-first, qui veulent parier "avec méthode" et pas au feeling. Sensibles au sans-engagement et à la transparence des résultats.

## Pricing validé
- **Découverte** : Gratuit — 1 prono/jour foot
- **Starter** : 9,90€/mois sans engagement — Tous les pronos foot, app, alertes
- **Pro** : 24,90€/mois — Multi-sports + value bets + analyse détaillée
- **VIP** : 59€/mois — Canal WhatsApp Business privé (50 places max), gros événements
- À la carte : ticket "gros match" 4,90€, pack weekend 9,90€

## Canal VIP
**WhatsApp Business** (canal broadcast + groupe Q/R hebdo). PAS Telegram (explicitement refusé).

## Direction artistique
- Style : **conseil premium light mode** (magazine éditorial pro, pas dark SaaS)
- Références structure : fusionai.framer.website, heymessage.framer.ai, oma-mindly.framer.website, setrex-saas-template.framer.ai
- Références light : Substack premium, The Athletic, Apple marketing pages
- Palette : fond crème chaud (#FAFAF7) + texte noir (#0A0A0A) + accent or (#B8941F) — imposée par le logo or/blanc/noir
- CTA primaire : noir solide + texte crème (pas gold solide — plus premium en light)
- Typo : Geist Sans + Geist Mono (Google Fonts)
- Pivot du dark → light mode pour positionner "cabinet de conseil sérieux", pas "tech startup"

## Stack technique
Next.js 16 + React 19 + Tailwind + Shadcn + Stripe + Supabase + Vercel. Worker IA Python séparé.

## Légal — non négociable
- Auto-entreprise OBLIGATOIRE avant encaissement (Alex en charge)
- Mentions +18, joueurs-info-service.fr, "paris comportent des risques"
- Aucune promesse de gain, ROI affiché avec pertes incluses
- Sources de données : APIs publiques uniquement (API-Football autorisée), pas de scraping Pinnacle/Betfair
