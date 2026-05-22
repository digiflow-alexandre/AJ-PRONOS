# Site (vitrine AJ Pronos)

> Vitrine Next.js 16 d'AJ Pronos. Charge le contexte projet complet + le boilerplate Next.

@../CLAUDE.md

@AGENTS.md

## Spécificités vitrine (vs future app)

- Pages **publiques uniquement** : Accueil, Pricing, À propos, Méthode, Résultats publics, Contact, FAQ, Pages légales.
- Pas d'authentification ici. Toute la partie compte utilisateur / paiement / dashboards vivra dans `../app/`.
- **Bandeau gambling permanent** ("+18" + lien `joueurs-info-service.fr` + "paris comportent des risques") sur toutes les pages.
- **Stripe désactivé** côté code tant qu'Alex n'a pas son SIRET auto-entrepreneur → boutons "S'abonner" redirigent vers une page **"Liste d'attente — ouverture imminente"**.
- Newsletter d'inscription pré-lancement via Supabase (récupérer les emails dès maintenant).
