/**
 * Contenu textuel des documents légaux de l'app AJ Pronos.
 *
 * Ces documents sont OBLIGATOIRES pour la review Apple App Store
 * (apps gambling-adjacent + apps avec abonnement payant).
 *
 * Éditeur : Julien Ruffin, entrepreneur individuel — auto-entreprise
 * immatriculée le 01/06/2026, SIRET 105 467 542 00012, TVA FR84105467542.
 */

export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'strong-p'; text: string } // paragraphe avec emphase légale
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'link'; label: string; url: string } // lien externe simple
  | { kind: 'phone'; label: string; tel: string } // numéro téléphone cliquable
  | { kind: 'email'; label: string; email: string };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  slug: 'mentions-legales' | 'cgv' | 'confidentialite' | 'jeu-responsable';
  title: string;
  eyebrow: string;
  lead: string;
  sections: LegalSection[];
  lastUpdate: string;
};

const LAST_UPDATE = '1er juin 2026';

export const LEGAL_DOCUMENTS: Record<LegalDocument['slug'], LegalDocument> = {
  'mentions-legales': {
    slug: 'mentions-legales',
    title: 'Mentions légales',
    eyebrow: 'Légal',
    lead:
      'Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN).',
    lastUpdate: LAST_UPDATE,
    sections: [
      {
        title: 'Éditeur',
        blocks: [
          { kind: 'p', text: 'L’application AJ Pronos est éditée par :' },
          {
            kind: 'ul',
            items: [
              'Julien Ruffin, entrepreneur individuel',
              'Statut : micro-entreprise',
              'SIRET : 105 467 542 00012',
              'N° TVA intracommunautaire : FR84105467542',
              'Code APE / NAF : 93.19Z (Autres activités liées au sport)',
              'Domiciliation : Rognac (13)',
              'Date d’immatriculation : 01/06/2026',
              'Activité : conseil en paris sportifs',
            ],
          },
          { kind: 'email', label: 'Contact', email: 'contact@ajpronos.fr' },
        ],
      },
      {
        title: 'Directeur de la publication',
        blocks: [
          { kind: 'p', text: 'Julien Ruffin, en qualité d’éditeur.' },
        ],
      },
      {
        title: 'Hébergement',
        blocks: [
          {
            kind: 'p',
            text: 'Les données utilisateurs et les contenus de l’application sont hébergés par :',
          },
          {
            kind: 'ul',
            items: [
              'Supabase Inc. — base de données et stockage (hébergement UE)',
              'DIGIFLOW Agency — site vitrine ajpronos.fr (serveurs internes)',
            ],
          },
        ],
      },
      {
        title: 'Distribution',
        blocks: [
          {
            kind: 'p',
            text: 'L’application est distribuée via l’App Store d’Apple Inc. (et ultérieurement le Google Play Store de Google LLC). Les conditions d’utilisation de ces plateformes s’appliquent en complément.',
          },
        ],
      },
      {
        title: 'Propriété intellectuelle',
        blocks: [
          {
            kind: 'p',
            text: 'L’ensemble des contenus présents dans l’application (textes, images, graphismes, logo, captures d’écran, mise en page) sont la propriété exclusive d’AJ Pronos, sauf mentions contraires explicites. Toute reproduction, représentation, modification, publication, adaptation totale ou partielle sans l’autorisation écrite préalable est interdite et susceptible de constituer une contrefaçon (articles L.335-2 et suivants du Code de la propriété intellectuelle).',
          },
        ],
      },
      {
        title: 'Nature du service',
        blocks: [
          {
            kind: 'strong-p',
            text: 'AJ Pronos est un service de conseil en pronostics sportifs. L’éditeur n’est ni un opérateur de paris agréé par l’ANJ (Autorité Nationale des Jeux), ni un bookmaker. Les pronostics diffusés ont une valeur informative et ne constituent en aucun cas une garantie de gain.',
          },
          {
            kind: 'p',
            text: 'Les paris sportifs comportent des risques d’addiction et de pertes financières. Service réservé aux personnes majeures (+18 ans).',
          },
        ],
      },
      {
        title: 'Responsabilité',
        blocks: [
          {
            kind: 'p',
            text: 'L’éditeur s’efforce d’assurer l’exactitude et la mise à jour des informations diffusées. Toutefois, il ne saurait être tenu responsable des erreurs, omissions, ou des résultats obtenus par l’usage de ces informations. L’utilisateur reconnaît utiliser les pronostics sous sa seule responsabilité.',
          },
        ],
      },
      {
        title: 'Droit applicable',
        blocks: [
          {
            kind: 'p',
            text: 'Les présentes mentions sont soumises au droit français. Tout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des tribunaux français.',
          },
        ],
      },
    ],
  },

  cgv: {
    slug: 'cgv',
    title: 'Conditions Générales de Vente',
    eyebrow: 'Légal',
    lead:
      'Les présentes CGV régissent les relations contractuelles entre AJ Pronos et toute personne souscrivant à l’un de ses abonnements via l’application mobile.',
    lastUpdate: LAST_UPDATE,
    sections: [
      {
        title: '1. Objet',
        blocks: [
          {
            kind: 'p',
            text: 'Les présentes Conditions Générales de Vente (CGV) ont pour objet de définir les modalités et conditions dans lesquelles AJ Pronos fournit ses services de conseil en pronostics sportifs aux abonnés (« le Client ») via son application mobile.',
          },
        ],
      },
      {
        title: '2. Éditeur',
        blocks: [
          {
            kind: 'p',
            text: 'Le service est édité par Julien Ruffin, entrepreneur individuel (micro-entreprise). Coordonnées complètes dans les mentions légales accessibles dans l’application.',
          },
        ],
      },
      {
        title: '3. Description des offres',
        blocks: [
          {
            kind: 'p',
            text: 'AJ Pronos propose plusieurs formules d’abonnement, sans engagement, résiliables à tout moment :',
          },
          {
            kind: 'ul',
            items: [
              'Essai gratuit — 7 jours offerts sur l’abonnement Starter lors de la première inscription, sans engagement, sans saisie de moyen de paiement.',
              'Starter — 9,90 € / mois. 1 pronostic par jour (football ou tennis), analyse complète de chaque pari, carnet personnel et ROI personnel, notifications push.',
              'Pro — 19,90 € / mois. 2 pronostics de notre analyste + 1 pari IA validé par notre analyste par jour, analyse complète, carnet personnel et ROI personnel, notifications push.',
              'VIP — 49,90 € / mois. Tout le pack Pro inclus, salon privé in-app avec l’analyste et les autres VIP (50 places maximum), coaching privé sur demande, pronostics sur les gros événements.',
            ],
          },
        ],
      },
      {
        title: '4. Souscription et paiement',
        blocks: [
          {
            kind: 'strong-p',
            text: 'Les abonnements sont souscrits et facturés directement par Apple via l’App Store (Apple In-App Purchase) sur iOS, conformément à la politique d’Apple Inc. Les conditions tarifaires sont indiquées au moment de la souscription dans l’application.',
          },
          {
            kind: 'p',
            text: 'Le paiement, la conservation du moyen de paiement, la sécurité des transactions et l’émission des reçus de paiement relèvent d’Apple. AJ Pronos ne collecte aucune donnée bancaire du Client.',
          },
          {
            kind: 'p',
            text: 'Les prix sont indiqués en euros, toutes taxes comprises. AJ Pronos bénéficie de la franchise en base de TVA (article 293 B du Code général des impôts) : la TVA n’est ni applicable ni récupérable sur la part éditeur.',
          },
        ],
      },
      {
        title: '5. Renouvellement automatique',
        blocks: [
          {
            kind: 'strong-p',
            text: 'Les abonnements sont reconduits tacitement à l’échéance via le moyen de paiement enregistré dans le compte Apple du Client, sauf annulation au moins 24 heures avant la fin de la période en cours.',
          },
          {
            kind: 'p',
            text: 'Le Client gère son abonnement (annulation, changement de pack, changement de moyen de paiement) directement depuis les Réglages de son appareil Apple, rubrique Abonnements. Un raccourci est également proposé dans l’application.',
          },
        ],
      },
      {
        title: '6. Droit de rétractation',
        blocks: [
          {
            kind: 'p',
            text: 'Conformément à l’article L.221-18 du Code de la consommation, le Client dispose d’un délai de 14 jours à compter de la souscription pour exercer son droit de rétractation. Ce droit s’exerce auprès d’Apple selon ses propres procédures de remboursement, ou auprès de notre service client.',
          },
          {
            kind: 'p',
            text: 'Toutefois, en cas d’accès immédiat au service (consultation de pronostics avant la fin du délai de 14 jours), le Client reconnaît, en activant son abonnement, renoncer à son droit de rétractation conformément à l’article L.221-28 du Code de la consommation (exécution intégrale avec accord préalable et exprès).',
          },
        ],
      },
      {
        title: '7. Résiliation',
        blocks: [
          {
            kind: 'p',
            text: 'Le Client peut résilier son abonnement à tout moment depuis les Réglages de son appareil Apple, rubrique Abonnements. La résiliation prend effet à la fin de la période en cours déjà payée. Aucun remboursement prorata temporis n’est effectué.',
          },
          {
            kind: 'p',
            text: 'AJ Pronos se réserve le droit de résilier unilatéralement un abonnement en cas de manquement grave aux présentes CGV (revente du contenu, partage des accès, comportement abusif), sans préavis ni indemnité.',
          },
        ],
      },
      {
        title: '8. Nature du service et absence de garantie',
        blocks: [
          {
            kind: 'strong-p',
            text: 'Les pronostics fournis par AJ Pronos relèvent du conseil et de l’analyse sportive. Ils ne constituent en aucun cas une garantie de gain. Les performances passées publiées ne préjugent pas des performances futures.',
          },
          {
            kind: 'p',
            text: 'Le Client reconnaît que les paris sportifs comportent des risques d’addiction et de pertes financières, et qu’il est seul responsable des mises qu’il choisit de placer auprès des opérateurs de paris agréés par l’ANJ. Le service est strictement réservé aux personnes majeures (+18 ans).',
          },
        ],
      },
      {
        title: '9. Données personnelles',
        blocks: [
          {
            kind: 'p',
            text: 'Les données collectées sont traitées conformément à la Politique de confidentialité, accessible dans l’application, à laquelle le Client est invité à se référer.',
          },
        ],
      },
      {
        title: '10. Litiges',
        blocks: [
          {
            kind: 'p',
            text: 'Les présentes CGV sont régies par le droit français. À défaut de résolution amiable, tout litige sera porté devant les tribunaux compétents du ressort du domicile de l’éditeur.',
          },
          {
            kind: 'p',
            text: 'Conformément à l’article L.612-1 du Code de la consommation, le Client peut recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable du litige.',
          },
        ],
      },
    ],
  },

  confidentialite: {
    slug: 'confidentialite',
    title: 'Politique de confidentialité',
    eyebrow: 'Légal',
    lead:
      'Conforme au Règlement Général sur la Protection des Données (RGPD) et à la Loi Informatique et Libertés modifiée.',
    lastUpdate: LAST_UPDATE,
    sections: [
      {
        title: '1. Responsable de traitement',
        blocks: [
          {
            kind: 'p',
            text: 'Le responsable du traitement des données personnelles collectées via l’application est Julien Ruffin, éditeur d’AJ Pronos (coordonnées complètes dans les Mentions légales).',
          },
          {
            kind: 'email',
            label: 'Pour toute question relative au traitement de vos données',
            email: 'contact@ajpronos.fr',
          },
        ],
      },
      {
        title: '2. Données collectées',
        blocks: [
          { kind: 'p', text: 'Selon les interactions avec le service, AJ Pronos collecte :' },
          {
            kind: 'ul',
            items: [
              'Données d’identification : adresse email, prénom (facultatif).',
              'Données de service : sport(s) favori(s), niveau de risque déclaré, historique des pronostics consultés, paris enregistrés dans le carnet personnel, statut d’abonnement.',
              'Données techniques : identifiant d’appareil anonymisé, type d’appareil, version OS, version de l’application, logs techniques (uniquement en cas de bug).',
              'Identifiants Apple : un identifiant anonyme d’achat fourni par Apple In-App Purchase pour gérer le statut de l’abonnement. Aucune donnée bancaire n’est collectée par AJ Pronos.',
            ],
          },
          {
            kind: 'strong-p',
            text: 'L’application n’utilise aucun identifiant publicitaire (IDFA) ni tracker tiers (Google Analytics, Facebook SDK, etc.).',
          },
        ],
      },
      {
        title: '3. Finalités du traitement',
        blocks: [
          { kind: 'p', text: 'Vos données sont utilisées pour les finalités suivantes :' },
          {
            kind: 'ul',
            items: [
              'Création et gestion de votre compte utilisateur.',
              'Fourniture du service de pronostics (envoi des pronos, notifications push, accès au salon VIP).',
              'Gestion du statut d’abonnement et de l’accès aux fonctionnalités.',
              'Calcul de vos statistiques personnelles (carnet, ROI personnel).',
              'Réponse à vos demandes via email.',
              'Respect des obligations légales (comptabilité, fiscalité).',
            ],
          },
        ],
      },
      {
        title: '4. Base légale',
        blocks: [
          { kind: 'p', text: 'Les traitements reposent sur les bases légales suivantes :' },
          {
            kind: 'ul',
            items: [
              'Exécution du contrat : gestion du compte et fourniture du service.',
              'Consentement : envoi de notifications push (révocable à tout moment dans les Réglages iOS).',
              'Obligation légale : conservation des données comptables pendant 10 ans (Code de commerce).',
              'Intérêt légitime : amélioration du service, prévention de la fraude.',
            ],
          },
        ],
      },
      {
        title: '5. Destinataires',
        blocks: [
          { kind: 'p', text: 'Vos données sont accessibles aux :' },
          {
            kind: 'ul',
            items: [
              'Personnel autorisé d’AJ Pronos (administrateur, analyste).',
              'Sous-traitants techniques : Supabase Inc. (base de données, en UE), Apple Inc. (gestion des abonnements In-App Purchase), RevenueCat Inc. (sync abonnements), Resend (envoi d’emails transactionnels), Expo (notifications push).',
            ],
          },
          {
            kind: 'p',
            text: 'Aucune donnée n’est revendue, louée ou cédée à des tiers à des fins commerciales.',
          },
        ],
      },
      {
        title: '6. Durée de conservation',
        blocks: [
          {
            kind: 'ul',
            items: [
              'Compte utilisateur actif : durée de l’abonnement + 3 ans après la dernière interaction.',
              'Données comptables : 10 ans (obligation légale).',
              'Logs techniques : 12 mois maximum.',
              'Demandes de contact : 3 ans à compter du dernier échange.',
            ],
          },
        ],
      },
      {
        title: '7. Vos droits',
        blocks: [
          { kind: 'p', text: 'Conformément au RGPD, vous disposez des droits suivants :' },
          {
            kind: 'ul',
            items: [
              'Droit d’accès à vos données.',
              'Droit de rectification des données inexactes.',
              'Droit à l’effacement (« droit à l’oubli »).',
              'Droit à la limitation du traitement.',
              'Droit à la portabilité de vos données.',
              'Droit d’opposition au traitement.',
              'Droit de retirer votre consentement à tout moment.',
            ],
          },
          {
            kind: 'email',
            label: 'Pour exercer ces droits, contactez',
            email: 'contact@ajpronos.fr',
          },
          {
            kind: 'p',
            text: 'Une réponse vous sera apportée dans un délai d’un mois. Vous disposez également du droit d’introduire une réclamation auprès de la CNIL.',
          },
          { kind: 'link', label: 'CNIL — Commission nationale de l’informatique et des libertés', url: 'https://www.cnil.fr' },
        ],
      },
      {
        title: '8. Sécurité',
        blocks: [
          {
            kind: 'p',
            text: 'AJ Pronos met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, altération ou divulgation : chiffrement TLS pour les communications, chiffrement local de la session utilisateur (Keychain iOS), authentification forte, contrôle d’accès, sauvegardes régulières.',
          },
        ],
      },
    ],
  },

  'jeu-responsable': {
    slug: 'jeu-responsable',
    title: 'Jeu responsable',
    eyebrow: 'Prévention',
    lead:
      'Les paris sportifs sont une activité de divertissement qui peut comporter des risques d’addiction et de pertes financières. AJ Pronos s’engage à promouvoir une pratique responsable.',
    lastUpdate: LAST_UPDATE,
    sections: [
      {
        title: 'Notre engagement',
        blocks: [
          {
            kind: 'strong-p',
            text: 'AJ Pronos n’incite jamais à parier davantage, ne promet jamais de gain garanti, et publie systématiquement les pertes comme les gains.',
          },
          {
            kind: 'p',
            text: 'Notre objectif est de donner aux parieurs adultes une méthode et une transparence — pas de transformer le pari en revenu ou en placement financier. Le pari sportif reste un loisir qui doit rester maîtrisé.',
          },
        ],
      },
      {
        title: 'Service réservé aux personnes majeures',
        blocks: [
          {
            kind: 'strong-p',
            text: 'L’application est strictement réservée aux personnes âgées de 18 ans ou plus. La confirmation de majorité est demandée lors de l’inscription. Toute fausse déclaration entraîne la résiliation immédiate du compte.',
          },
        ],
      },
      {
        title: 'Conseils pour parier avec méthode',
        blocks: [
          {
            kind: 'ul',
            items: [
              'Fixez-vous un budget mensuel maximum dédié au pari sportif, et ne le dépassez jamais.',
              'Ne pariez jamais d’argent dont vous avez besoin pour vivre (loyer, factures, alimentation).',
              'Ne pariez jamais pour « se refaire » après une série de pertes : c’est le réflexe classique qui aggrave les pertes.',
              'Variez vos activités de loisir : si le pari prend trop de place dans votre quotidien, faites une pause.',
              'Tenez un suivi écrit (comme le carnet personnel de l’app) pour avoir une vision honnête de vos gains et pertes réels.',
              'Pariez sobre. L’alcool et la fatigue altèrent le jugement.',
            ],
          },
        ],
      },
      {
        title: 'Signes d’un comportement à risque',
        blocks: [
          { kind: 'p', text: 'Soyez attentif si vous constatez l’un de ces signes :' },
          {
            kind: 'ul',
            items: [
              'Vous pensez aux paris en permanence, même au travail ou en famille.',
              'Vous mentez à vos proches sur le montant que vous misez.',
              'Vous parier plus pour récupérer les pertes précédentes.',
              'Vous empruntez de l’argent ou vendez des biens pour parier.',
              'Vous ressentez de l’irritabilité ou de l’anxiété lorsque vous ne pariez pas.',
              'Le pari nuit à vos relations, votre travail, vos finances ou votre santé.',
            ],
          },
          {
            kind: 'p',
            text: 'Si l’un de ces points vous concerne, n’attendez pas — contactez les services d’aide ci-dessous. La prise en charge est gratuite, confidentielle et anonyme.',
          },
        ],
      },
      {
        title: 'Aide et accompagnement',
        blocks: [
          {
            kind: 'phone',
            label: 'Joueurs Info Service (anonyme, gratuit, 7j/7 de 8h à 2h)',
            tel: '0974751313',
          },
          {
            kind: 'link',
            label: 'joueurs-info-service.fr — chat en ligne, forum, conseils',
            url: 'https://www.joueurs-info-service.fr',
          },
          {
            kind: 'link',
            label: 'Auto-évaluation Évalujeu (test rapide et confidentiel)',
            url: 'https://www.joueurs-info-service.fr/evalujeu/',
          },
        ],
      },
      {
        title: 'Demande d’interdiction de jeu',
        blocks: [
          {
            kind: 'p',
            text: 'Toute personne peut demander à être inscrite sur le fichier national des interdits de jeu, géré par l’Autorité Nationale des Jeux (ANJ). Cette inscription interdit l’accès à tous les jeux d’argent et de hasard en France (casinos, sites de paris en ligne, points de vente FDJ/PMU) pour une durée minimale de 3 ans.',
          },
          {
            kind: 'link',
            label: 'Demande d’interdiction volontaire de jeu — ANJ',
            url: 'https://anj.fr/joueurs/interdiction-volontaire-de-jeu',
          },
        ],
      },
      {
        title: 'Nous joindre',
        blocks: [
          {
            kind: 'p',
            text: 'Si vous estimez que notre service ne vous aide pas à parier de manière responsable, ou si vous souhaitez nous signaler un contenu inapproprié, contactez-nous :',
          },
          { kind: 'email', label: 'Email', email: 'contact@ajpronos.fr' },
        ],
      },
    ],
  },
};

export const LEGAL_DOCUMENTS_LIST: LegalDocument[] = [
  LEGAL_DOCUMENTS['mentions-legales'],
  LEGAL_DOCUMENTS.cgv,
  LEGAL_DOCUMENTS.confidentialite,
  LEGAL_DOCUMENTS['jeu-responsable'],
];
