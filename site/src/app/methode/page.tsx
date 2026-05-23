import type { Metadata } from "next";
import Link from "next/link";
import { methodSteps } from "@/lib/data";

export const metadata: Metadata = {
  title: "Notre méthode — AJ Pronos",
  description:
    "Comment AJ Pronos sélectionne ses pronostics foot & tennis : collecte de data, analyse humaine assistée par IA, publication directe dans l'app. Méthode rigoureuse et transparente.",
};

const stepDetails: Array<{
  bullets: string[];
  pitch: string;
}> = [
  {
    pitch: "On consolide en un seul écran toute la donnée d'un match — bien avant que les autres canaux n'aient lu la composition.",
    bullets: [
      "Compositions probables jusqu'à 1h avant le coup d'envoi",
      "Blessures et suspensions sources officielles",
      "Forme récente 8 matchs, pondérée dom / ext",
      "Head-to-head sur 5 saisons en contexte similaire",
      "Cotes en temps réel chez plusieurs bookmakers ANJ",
      "Contexte : enjeu, météo, calendrier européen",
    ],
  },
  {
    pitch: "L'analyste tranche à la main, pari par pari. Lecture tactique, dynamique d'équipe, intuition forgée par 10 ans d'analyses.",
    bullets: [
      "Lecture tactique : styles, zones exploitables",
      "Dynamique d'équipe : moral, déclarations, vestiaire",
      "Sélectivité max : moins de 30 paris publiés / semaine",
      "Mise conseillée + cote minimale acceptable",
    ],
  },
  {
    pitch: "Notification push directe dans l'app, 1h avant le coup d'envoi. Tout reste sous notre toit — zéro canal externe, zéro spam.",
    bullets: [
      "Push notification in-app + email parallèle",
      "Format clair : match, pari, cote min, mise, raisonnement",
      "Pari publié 1h avant le match (compos officielles intégrées)",
      "Espace privé in-app VIP + Teams hebdo (50 places max)",
    ],
  },
];

export default function MethodePage() {
  return (
    <>
      {/* === HERO PLEIN ÉCRAN AVEC IMAGE BG === */}
      <section className="m-hero">
        <div className="m-hero-media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/decorations/stadium-tunnel.png" alt="" />
        </div>
        <div className="m-hero-overlay" aria-hidden="true" />

        <div className="wrap m-hero-grid">
          <div className="m-hero-text">
            <Link href="/" className="page-hero-back">← Accueil</Link>
            <span className="eyebrow m-hero-eyebrow">Notre méthode</span>
            <h1>
              Pari par pari.<br />
              <em>Sans raccourci.</em>
            </h1>
            <p className="m-hero-lead">
              On scanne. On tranche à la main. On te le pousse dans l&apos;app.
              Trois étapes, zéro tricherie. Voici comment ça marche, en détail.
            </p>
            <div className="m-hero-actions">
              <a href="#process" className="page-cta-btn">Voir le process →</a>
              <Link href="/resultats" className="page-cta-link">Voir les résultats publics</Link>
            </div>
          </div>

          <div className="m-hero-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/decorations/method-card-02.png"
              alt="Carte méthode AJ Pronos : filtre humain"
              className="m-hero-card"
            />
            <div className="m-hero-stats">
              <div><strong>1 / 3</strong><span>paris retenus max</span></div>
              <div><strong>5</strong><span>saisons H2H scannées</span></div>
              <div><strong>0</strong><span>canal spam</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* === STRIP "EN UN COUP D'ŒIL" : 3 cards méthode FUT === */}
      <section id="process" className="m-overview">
        <div className="wrap">
          <header className="m-overview-head">
            <span className="eyebrow">En un coup d&apos;œil</span>
            <h2>Trois étapes, <em>une rigueur</em>.</h2>
          </header>
          <div className="m-overview-grid">
            {methodSteps.map((step) => (
              <a
                key={step.number}
                href={`#step-${step.number}`}
                className="m-overview-card"
                aria-label={`Aller à l'étape ${step.number} : ${step.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.image} alt="" className="m-overview-card-img" loading="lazy" />
                <div className="m-overview-card-body">
                  <span className="m-overview-card-num">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.eyebrow}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* === 3 SECTIONS DÉTAILLÉES === */}
      {methodSteps.map((step, idx) => {
        const detail = stepDetails[idx];
        return (
          <section
            key={step.number}
            id={`step-${step.number}`}
            className={`m-deep ${idx % 2 === 1 ? "m-deep--alt" : ""}`}
          >
            <div className="wrap m-deep-grid">
              <div className="m-deep-content">
                <span className="m-deep-step">Étape {step.number}</span>
                <h2>{step.title}</h2>
                <p className="m-deep-pitch">{detail.pitch}</p>
                <ul className="m-deep-bullets">
                  {detail.bullets.map((b) => (
                    <li key={b}><span aria-hidden="true">→</span> {b}</li>
                  ))}
                </ul>
                <div className="m-deep-tags">
                  {step.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="m-deep-visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.image} alt={step.alt ?? step.title} loading="lazy" />
              </div>
            </div>
          </section>
        );
      })}

      {/* === MANIFESTE "CE QU'ON NE FAIT PAS" === */}
      <section className="m-manifest">
        <div className="m-manifest-bg" aria-hidden="true" />
        <div className="wrap">
          <header className="m-manifest-head">
            <span className="eyebrow">Honnêteté radicale</span>
            <h2>
              Ce qu&apos;on <em>ne fait pas</em>.<br />
              Et qu&apos;on ne fera jamais.
            </h2>
          </header>
          <div className="m-manifest-grid">
            <article>
              <span>01</span>
              <h3>Promettre du gain</h3>
              <p>Aucun pronostiqueur sérieux ne le fait. Les paris sportifs comportent des risques d&apos;addiction et de pertes.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Cacher nos pertes</h3>
              <p>Tous les paris publiés sont archivés, gagnants comme perdants. <Link href="/resultats">Voir l&apos;historique</Link>.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Pousser à parier plus</h3>
              <p>Pas de pari à publier&nbsp;? On ne publie pas. Pas de filler pour faire du volume.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Revendre tes données</h3>
              <p>Données minimales, conservées le temps nécessaire, jamais cédées. <Link href="/confidentialite">Politique</Link>.</p>
            </article>
          </div>
        </div>
      </section>

      {/* === CTA FINAL === */}
      <section className="page-cta">
        <div className="page-cta-bg" aria-hidden="true" />
        <div className="wrap page-cta-inner">
          <span className="eyebrow">On y va&nbsp;?</span>
          <h2>Prêt à voir nos <em>résultats</em>&nbsp;?</h2>
          <p>
            Plutôt que de te promettre, on te montre. Tous nos paris des 5
            derniers mois sont publics, gains et pertes inclus.
          </p>
          <div className="page-cta-actions">
            <Link href="/resultats" className="page-cta-btn">
              Voir l&apos;historique public →
            </Link>
            <Link href="/#tarifs" className="page-cta-link">
              ou découvrir nos abonnements
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
