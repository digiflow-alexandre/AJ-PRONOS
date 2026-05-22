import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — AJ Pronos",
  description: "Politique de protection des données personnelles AJ Pronos, conforme RGPD.",
};

export default function ConfidentialitePage() {
  return (
    <article className="prose-page">
      <header className="prose-head">
        <span className="eyebrow">Légal</span>
        <h1>Politique de confidentialité</h1>
        <p className="prose-lead">
          Conforme au Règlement Général sur la Protection des Données (RGPD)
          et à la Loi Informatique et Libertés modifiée.
        </p>
      </header>
      <Link href="/" className="prose-back">← Retour à l&apos;accueil</Link>

      <h2>1. Responsable de traitement</h2>
      <p>
        Le responsable du traitement des données personnelles collectées sur
        ce site est <strong>Alex Guerreiro</strong>, éditeur d&apos;AJ Pronos
        (coordonnées complètes dans les <Link href="/mentions-legales">mentions légales</Link>).
      </p>
      <p>
        Pour toute question relative au traitement de vos données, contactez :{" "}
        <a href="mailto:hello@ajpronos.fr">hello@ajpronos.fr</a>.
      </p>

      <h2>2. Données collectées</h2>
      <p>Selon les interactions avec le service, AJ Pronos collecte :</p>
      <ul>
        <li><strong>Données d&apos;identification</strong> : prénom, nom, adresse email, numéro de téléphone (pour le canal WhatsApp Business des abonnés VIP).</li>
        <li><strong>Données de connexion</strong> : adresse IP, type de navigateur, pages consultées, horodatage (logs techniques).</li>
        <li><strong>Données de paiement</strong> : les informations bancaires sont traitées directement par Stripe et ne transitent pas sur nos serveurs ; nous conservons uniquement un identifiant client Stripe et l&apos;historique des transactions (montant, date, statut).</li>
        <li><strong>Données de service</strong> : historique des pronostics envoyés, dates de connexion, statut d&apos;abonnement.</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont utilisées pour les finalités suivantes :</p>
      <ul>
        <li>Création et gestion de votre compte utilisateur.</li>
        <li>Fourniture du service de pronostics (envoi des pronos, alertes WhatsApp, accès au canal VIP).</li>
        <li>Gestion de la facturation et du paiement des abonnements.</li>
        <li>Réponse à vos demandes via le formulaire de contact ou email.</li>
        <li>Envoi d&apos;informations relatives au service (uniquement si vous l&apos;avez accepté).</li>
        <li>Respect des obligations légales (comptabilité, fiscalité).</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>Les traitements reposent sur les bases légales suivantes :</p>
      <ul>
        <li><strong>Exécution du contrat</strong> : gestion du compte et fourniture du service.</li>
        <li><strong>Consentement</strong> : envoi de communications marketing, dépôt de cookies non-essentiels.</li>
        <li><strong>Obligation légale</strong> : conservation des données de facturation pendant 10 ans (Code de commerce).</li>
        <li><strong>Intérêt légitime</strong> : amélioration du service, prévention de la fraude.</li>
      </ul>

      <h2>5. Destinataires</h2>
      <p>Vos données sont accessibles aux :</p>
      <ul>
        <li>Personnel autorisé d&apos;AJ Pronos (administrateur, analyste).</li>
        <li>Sous-traitants techniques : <strong>Supabase</strong> (hébergement de la base de données, en UE), <strong>Stripe</strong> (paiement), <strong>WhatsApp Business / Meta</strong> (messagerie pour les abonnés VIP).</li>
      </ul>
      <p>
        Aucune donnée n&apos;est revendue, louée ou cédée à des tiers à des fins
        commerciales.
      </p>

      <h2>6. Durée de conservation</h2>
      <ul>
        <li><strong>Compte utilisateur actif</strong> : durée de l&apos;abonnement + 3 ans après la dernière interaction.</li>
        <li><strong>Données de facturation</strong> : 10 ans (obligation comptable).</li>
        <li><strong>Logs techniques</strong> : 12 mois maximum.</li>
        <li><strong>Demandes de contact</strong> : 3 ans à compter du dernier échange.</li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li>Droit d&apos;<strong>accès</strong> à vos données.</li>
        <li>Droit de <strong>rectification</strong> des données inexactes.</li>
        <li>Droit à l&apos;<strong>effacement</strong> (« droit à l&apos;oubli »).</li>
        <li>Droit à la <strong>limitation</strong> du traitement.</li>
        <li>Droit à la <strong>portabilité</strong> de vos données.</li>
        <li>Droit d&apos;<strong>opposition</strong> au traitement.</li>
        <li>Droit de retirer votre <strong>consentement</strong> à tout moment.</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez{" "}
        <a href="mailto:hello@ajpronos.fr">hello@ajpronos.fr</a>. Une réponse vous
        sera apportée dans un délai d&apos;un mois. Vous disposez également du
        droit d&apos;introduire une réclamation auprès de la{" "}
        <a href="https://www.cnil.fr" rel="noopener noreferrer" target="_blank">CNIL</a>{" "}
        (Commission Nationale de l&apos;Informatique et des Libertés).
      </p>

      <h2>8. Sécurité</h2>
      <p>
        AJ Pronos met en œuvre des mesures techniques et organisationnelles
        appropriées pour protéger vos données contre tout accès non autorisé,
        perte, altération ou divulgation : chiffrement TLS, authentification
        forte, contrôle d&apos;accès, sauvegardes régulières.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Le site utilise des cookies pour assurer son fonctionnement et améliorer
        votre expérience. Pour le détail des cookies et leur gestion, consultez
        notre <Link href="/cookies">politique cookies</Link>.
      </p>

      <p className="prose-meta">Dernière mise à jour : 22 mai 2026.</p>
    </article>
  );
}
