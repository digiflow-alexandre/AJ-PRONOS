import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact — AJ Pronos",
  description: "Contactez l'équipe AJ Pronos pour toute question sur les abonnements, la méthode ou le service.",
};

export default function ContactPage() {
  return (
    <article className="prose-page">
      <header className="prose-head">
        <span className="eyebrow">Contact</span>
        <h1>On vous répond.</h1>
        <p className="prose-lead">
          Une question sur la méthode, l&apos;abonnement, ou un retour à nous faire ?
          On lit tous les messages et on revient sous 48h ouvrées.
        </p>
      </header>
      <Link href="/" className="prose-back">← Retour à l&apos;accueil</Link>

      <section className="contact-form-section">
        <ContactForm />
      </section>

      <h2>Autres moyens de nous joindre</h2>
      <div className="contact-grid">
        <section className="contact-card">
          <h3>Email direct</h3>
          <p>Pour aller plus vite, écrivez-nous directement :</p>
          <a className="contact-link" href="mailto:hello@ajpronos.fr">
            hello@ajpronos.fr →
          </a>
          <p className="contact-hint">Réponse sous 48h ouvrées maximum.</p>
        </section>

        <section className="contact-card">
          <h3>Salon VIP in-app</h3>
          <p>
            Pour les abonnés <strong>VIP</strong>, salon privé dans
            l&apos;application avec l&apos;analyste (50 places maximum) +
            réunion hebdomadaire sur Microsoft Teams.
          </p>
          <p className="contact-hint">
            L&apos;accès vous est communiqué après souscription via la{" "}
            <Link href="/#tarifs">page Tarifs</Link>.
          </p>
        </section>
      </div>

      <section className="contact-help">
        <h3>Besoin d&apos;aide avec le jeu&nbsp;?</h3>
        <p>
          Les paris sportifs comportent des risques d&apos;addiction. Si vous
          ressentez une dépendance ou souhaitez en parler, contactez{" "}
          <strong>Joueurs Info Service</strong>, anonyme, gratuit et confidentiel :
        </p>
        <p>
          <a href="tel:0974751313">09 74 75 13 13</a> &nbsp;·&nbsp;{" "}
          <a href="https://www.joueurs-info-service.fr" rel="noopener noreferrer" target="_blank">
            joueurs-info-service.fr
          </a>
        </p>
      </section>
    </article>
  );
}
