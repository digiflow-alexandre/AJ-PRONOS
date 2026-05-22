import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique cookies — AJ Pronos",
  description: "Informations sur les cookies utilisés par le site AJ Pronos et comment les gérer.",
};

export default function CookiesPage() {
  return (
    <article className="prose-page">
      <header className="prose-head">
        <span className="eyebrow">Légal</span>
        <h1>Politique de cookies</h1>
        <p className="prose-lead">
          Les cookies sont de petits fichiers texte déposés sur votre appareil
          pour assurer le fonctionnement du site et améliorer votre expérience.
        </p>
      </header>
      <Link href="/" className="prose-back">← Retour à l&apos;accueil</Link>

      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un fichier de petite taille (quelques kilo-octets)
        déposé par un site web sur votre terminal (ordinateur, smartphone,
        tablette) lorsque vous le consultez. Il permet au site de mémoriser
        des informations vous concernant (langue, identifiant de session,
        préférences) afin de vous offrir une expérience cohérente.
      </p>

      <h2>2. Cookies utilisés par AJ Pronos</h2>

      <h3>Cookies strictement nécessaires (sans consentement requis)</h3>
      <p>Ces cookies sont indispensables au fonctionnement du site.</p>
      <ul>
        <li><strong>Cookie de session Supabase</strong> — authentification utilisateur. Durée : session.</li>
        <li><strong>Cookie CSRF</strong> — protection contre les attaques cross-site. Durée : session.</li>
        <li><strong>Cookie de préférence cookies</strong> — mémorise votre choix sur les cookies. Durée : 6 mois.</li>
      </ul>

      <h3>Cookies de paiement</h3>
      <p>Déposés par Stripe lors d&apos;un paiement, pour la sécurité de la transaction.</p>
      <ul>
        <li><strong>Cookies Stripe</strong> — détection de fraude, gestion de session de paiement. Durée : jusqu&apos;à 1 an. Voir la <a href="https://stripe.com/fr/privacy" rel="noopener noreferrer" target="_blank">politique Stripe</a>.</li>
      </ul>

      <h3>Cookies de mesure d&apos;audience (avec consentement)</h3>
      <p>
        Le site n&apos;utilise actuellement <strong>aucun outil d&apos;analyse tiers</strong>
        (Google Analytics, Plausible, etc.). Si cela devait évoluer, votre
        consentement explicite vous serait demandé via une bannière dédiée
        avant tout dépôt.
      </p>

      <h2>3. Comment gérer les cookies ?</h2>
      <p>
        Vous pouvez à tout moment paramétrer vos préférences :
      </p>
      <ul>
        <li><strong>Via la bannière de consentement</strong> affichée lors de votre première visite.</li>
        <li><strong>Via votre navigateur</strong> : la plupart des navigateurs permettent de bloquer ou supprimer les cookies. Attention, désactiver les cookies strictement nécessaires peut empêcher le bon fonctionnement du site.</li>
      </ul>
      <p>Liens vers les paramètres cookies des principaux navigateurs :</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" rel="noopener noreferrer" target="_blank">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur" rel="noopener noreferrer" target="_blank">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" rel="noopener noreferrer" target="_blank">Safari</a></li>
        <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge" rel="noopener noreferrer" target="_blank">Microsoft Edge</a></li>
      </ul>

      <h2>4. Plus d&apos;informations</h2>
      <p>
        Pour une vue globale sur le traitement de vos données personnelles,
        consultez notre <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
      <p>
        Vous pouvez également vous informer sur les cookies via le site de la{" "}
        <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi/le-deploiement-des-cookies-comment-faire-en-pratique" rel="noopener noreferrer" target="_blank">CNIL</a>.
      </p>

      <p className="prose-meta">Dernière mise à jour : 22 mai 2026.</p>
    </article>
  );
}
