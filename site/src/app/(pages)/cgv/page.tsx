import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — AJ Pronos",
  description: "CGV applicables aux abonnements AJ Pronos.",
};

export default function CgvPage() {
  return (
    <article className="prose-page">
      <header className="prose-head">
        <span className="eyebrow">Légal</span>
        <h1>Conditions Générales de Vente</h1>
        <p className="prose-lead">
          Les présentes CGV régissent les relations contractuelles entre AJ
          Pronos et toute personne souscrivant à l&apos;un de ses abonnements.
        </p>
      </header>
      <Link href="/" className="prose-back">← Retour à l&apos;accueil</Link>

      <h2>1. Objet</h2>
      <p>
        Les présentes Conditions Générales de Vente (CGV) ont pour objet de
        définir les modalités et conditions dans lesquelles AJ Pronos fournit
        ses services de conseil en pronostics sportifs aux abonnés (« le
        Client »).
      </p>

      <h2>2. Éditeur</h2>
      <p>
        Le service est édité par Alex Guerreiro, auto-entrepreneur, SIRET{" "}
        <em>[À compléter]</em>, dont les coordonnées complètes figurent dans
        les <Link href="/mentions-legales">mentions légales</Link>.
      </p>

      <h2>3. Description des offres</h2>
      <p>
        AJ Pronos propose plusieurs formules d&apos;abonnement, sans engagement,
        résiliables à tout moment :
      </p>
      <ul>
        <li><strong>Découverte</strong> — Gratuit. 1 pronostic foot par jour, accès sans inscription.</li>
        <li><strong>Starter</strong> — 9,90 € / mois ou 95,00 € / an. Tous les pronostics de la veille (J-1) et un prono du jour J, accès app et espace membre, notifications push in-app, historique complet.</li>
        <li><strong>Pro</strong> — 24,90 € / mois ou 239,00 € / an. Pronostics foot et tennis en temps réel (jour J), recommandations personnalisées (assistance IA validée par notre analyste), analyse détaillée de chaque pari, stats et ROI personnels.</li>
        <li><strong>VIP</strong> — 59,00 € / mois ou 566,00 € / an. Salon privé in-app avec l&apos;analyste (50 places maximum), réunion hebdomadaire Microsoft Teams (stratégie, budget, suivi personnalisé), pronostics sur les gros événements (Champions League, finales), ROI tracking personnalisé.</li>
      </ul>

      <h2>4. Souscription et paiement</h2>
      <p>
        La souscription s&apos;effectue exclusivement en ligne via le site
        ajpronos.fr. Le paiement est traité par <strong>Stripe</strong>, prestataire de
        paiement sécurisé. Le Client reconnaît avoir pris connaissance des
        présentes CGV et les accepter sans réserve avant la finalisation de sa
        commande.
      </p>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises. AJ Pronos
        bénéficie de la <strong>franchise en base de TVA</strong> (article 293 B du Code
        général des impôts) : la TVA n&apos;est ni applicable ni récupérable.
      </p>

      <h2>5. Renouvellement automatique</h2>
      <p>
        Les abonnements mensuels ou annuels sont reconduits tacitement à
        l&apos;échéance, par prélèvement automatique sur le moyen de paiement
        enregistré. Le Client peut résilier à tout moment depuis son espace
        membre, jusqu&apos;à la veille de la date de renouvellement.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L.221-18 du Code de la consommation, le
        Client dispose d&apos;un délai de <strong>14 jours</strong> à compter de la souscription
        pour exercer son droit de rétractation, sans avoir à motiver sa
        décision.
      </p>
      <p>
        Toutefois, en cas d&apos;accès immédiat au service (publication de
        pronostics avant la fin du délai de 14 jours), le Client reconnaît
        expressément, en cochant la case prévue à cet effet lors de la
        souscription, renoncer à son droit de rétractation conformément à
        l&apos;article L.221-28 du Code de la consommation (exécution intégrale
        avant la fin du délai avec accord préalable et exprès).
      </p>

      <h2>7. Résiliation</h2>
      <p>
        Le Client peut résilier son abonnement à tout moment depuis son
        espace membre ou en contactant <a href="mailto:hello@ajpronos.fr">hello@ajpronos.fr</a>.
        La résiliation prend effet à la fin de la période en cours déjà payée.
        Aucun remboursement prorata temporis n&apos;est effectué.
      </p>
      <p>
        AJ Pronos se réserve le droit de résilier unilatéralement un
        abonnement en cas de manquement grave aux présentes CGV (revente du
        contenu, partage des accès, comportement abusif), sans préavis ni
        indemnité.
      </p>

      <h2>8. Nature du service et absence de garantie</h2>
      <p>
        Les pronostics fournis par AJ Pronos relèvent du <strong>conseil et de
        l&apos;analyse sportive</strong>. Ils ne constituent <strong>en aucun cas</strong> une
        garantie de gain. Les performances passées publiées ne préjugent pas
        des performances futures.
      </p>
      <p>
        Le Client reconnaît que les paris sportifs comportent des risques
        d&apos;addiction et de pertes financières, et qu&apos;il est seul responsable
        des mises qu&apos;il choisit de placer auprès des opérateurs de paris agréés
        par l&apos;ANJ. Le service est strictement réservé aux personnes majeures
        (+18 ans).
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Les données collectées sont traitées conformément à la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>, à laquelle le Client est invité à se référer.
      </p>

      <h2>10. Litiges</h2>
      <p>
        Les présentes CGV sont régies par le droit français. À défaut de
        résolution amiable, tout litige sera porté devant les tribunaux
        compétents du ressort du domicile de l&apos;éditeur.
      </p>
      <p>
        Conformément à l&apos;article L.612-1 du Code de la consommation, le
        Client peut recourir gratuitement à un médiateur de la consommation
        en vue de la résolution amiable du litige.
      </p>

      <p className="prose-meta">Dernière mise à jour : 22 mai 2026.</p>
    </article>
  );
}
