import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales — AJ Pronos",
  description: "Mentions légales du site AJ Pronos, service de conseil en paris sportifs.",
};

export default function MentionsLegalesPage() {
  return (
    <article className="prose-page">
      <header className="prose-head">
        <span className="eyebrow">Légal</span>
        <h1>Mentions légales</h1>
        <p className="prose-lead">
          Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004
          pour la confiance dans l&apos;économie numérique (LCEN).
        </p>
      </header>
      <Link href="/" className="prose-back">← Retour à l&apos;accueil</Link>

      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>ajpronos.fr</strong> est édité par :
      </p>
      <ul>
        <li><strong>Julien Ruffin</strong>, entrepreneur individuel</li>
        <li>Statut : Auto-entrepreneur</li>
        <li>SIRET : 105 467 542 00012</li>
        <li>Adresse de domiciliation : <em>[À compléter]</em></li>
        <li>Email : <a href="mailto:hello@ajpronos.fr">hello@ajpronos.fr</a></li>
        <li>Activité : conseil en paris sportifs</li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>Julien Ruffin, en qualité d&apos;éditeur.</p>

      <h2>Hébergeur</h2>
      <p>
        Le site est hébergé par :
      </p>
      <ul>
        <li><strong>DIGIFLOW Agency</strong> — serveurs internes</li>
        <li>Site web : <a href="https://digiflow-agency.fr" rel="noopener noreferrer" target="_blank">digiflow-agency.fr</a></li>
        <li>Contact : <em>[Adresse hébergeur à compléter]</em></li>
      </ul>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus présents sur le site (textes, images, graphismes,
        logo, vidéos, screenshots, mise en page) sont la propriété exclusive
        d&apos;AJ Pronos, sauf mentions contraires explicites. Toute reproduction,
        représentation, modification, publication, adaptation totale ou partielle
        sans l&apos;autorisation écrite préalable est interdite et susceptible de
        constituer une contrefaçon (articles L.335-2 et suivants du Code de la
        propriété intellectuelle).
      </p>

      <h2>Nature du service</h2>
      <p>
        AJ Pronos est un service de <strong>conseil en pronostics sportifs</strong>.
        L&apos;éditeur n&apos;est ni un opérateur de paris agréé par l&apos;ANJ (Autorité
        Nationale des Jeux), ni un bookmaker. Les pronostics diffusés ont une
        valeur informative et ne constituent en aucun cas une garantie de gain.
      </p>
      <p>
        Les paris sportifs comportent des risques d&apos;addiction et de pertes
        financières. Service réservé aux personnes majeures (+18 ans). En cas
        de difficulté liée au jeu, contacter Joueurs Info Service au{" "}
        <a href="tel:0974751313">09 74 75 13 13</a> ou consulter{" "}
        <a href="https://www.joueurs-info-service.fr" rel="noopener noreferrer" target="_blank">joueurs-info-service.fr</a>.
      </p>

      <h2>Responsabilité</h2>
      <p>
        L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des
        informations diffusées. Toutefois, il ne saurait être tenu responsable
        des erreurs, omissions, ou des résultats obtenus par l&apos;usage de ces
        informations. L&apos;utilisateur reconnaît utiliser les pronostics sous sa
        seule responsabilité.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Le présent site et ses mentions légales sont soumis au droit français.
        Tout litige relatif à leur interprétation ou exécution relève de la
        compétence exclusive des tribunaux français.
      </p>

      <p className="prose-meta">Dernière mise à jour : 22 mai 2026.</p>
    </article>
  );
}
