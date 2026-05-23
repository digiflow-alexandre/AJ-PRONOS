import type { Metadata } from "next";
import Link from "next/link";
import { Transparency } from "@/components/site/Transparency";
import { monthlySummary, monthsList } from "@/lib/data";

export const metadata: Metadata = {
  title: "Résultats publics — AJ Pronos",
  description:
    "Historique complet et transparent des pronostics AJ Pronos. Gains et pertes affichés bruts, mois par mois. Performance passée ne préjuge pas des résultats futurs.",
};

export default function ResultatsPage() {
  const rois = monthsList.map((m) => monthlySummary[m.key].roi);
  const totalBets = monthsList.reduce((acc, m) => acc + monthlySummary[m.key].total, 0);
  const totalWins = monthsList.reduce((acc, m) => acc + monthlySummary[m.key].wins, 0);
  const avgRoi = rois.reduce((acc, r) => acc + r, 0) / rois.length;
  const winRate = totalBets > 0 ? Math.round((totalWins / totalBets) * 100) : 0;
  const bestMonth = monthsList.reduce((best, m) => {
    return monthlySummary[m.key].roi > monthlySummary[best.key].roi ? m : best;
  }, monthsList[0]);
  const worstMonth = monthsList.reduce((worst, m) => {
    return monthlySummary[m.key].roi < monthlySummary[worst.key].roi ? m : worst;
  }, monthsList[0]);

  return (
    <>
      <section className="page-hero page-hero--dark resultats-hero">
        <div className="page-hero-bg" aria-hidden="true" />
        <div className="wrap page-hero-inner">
          <Link href="/" className="page-hero-back">← Accueil</Link>
          <span className="eyebrow page-hero-eyebrow">Transparence totale</span>
          <h1>
            Résultats <em>publics</em>.<br />
            Gains. Pertes. <em>Tout est là.</em>
          </h1>
          <p className="page-hero-lead">
            Tous nos pronostics, mois par mois. Aucune ligne retirée. Si on a
            eu un mauvais mois, il est là aussi. La performance passée ne
            préjuge pas des résultats futurs.
          </p>

          <div className="resultats-hero-kpi">
            <div className="resultats-hero-card resultats-hero-card--main">
              <span className="resultats-hero-label">ROI moyen · 5 mois</span>
              <span className="resultats-hero-value">+{avgRoi.toFixed(1)}<small>%</small></span>
              <span className="resultats-hero-hint">
                Meilleur mois&nbsp;: {bestMonth.label} (+{monthlySummary[bestMonth.key].roi.toFixed(1)}%) · Pire mois&nbsp;: {worstMonth.label} (+{monthlySummary[worstMonth.key].roi.toFixed(1)}%)
              </span>
            </div>
            <div className="resultats-hero-side">
              <div className="resultats-hero-card">
                <span className="resultats-hero-label">Paris</span>
                <span className="resultats-hero-value">{totalBets}</span>
                <span className="resultats-hero-hint">analysés sur 5 mois</span>
              </div>
              <div className="resultats-hero-card">
                <span className="resultats-hero-label">Réussite</span>
                <span className="resultats-hero-value">{winRate}<small>%</small></span>
                <span className="resultats-hero-hint">{totalWins} / {totalBets} gagnants</span>
              </div>
              <div className="resultats-hero-card">
                <span className="resultats-hero-label">Mois suivis</span>
                <span className="resultats-hero-value">{monthsList.length}</span>
                <span className="resultats-hero-hint">historique libre d&apos;accès</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="resultats-disclaimer-strip">
        <div className="wrap">
          <p>
            <strong>Performance passée, performance non garantie.</strong>{" "}
            Les résultats reflètent l&apos;activité d&apos;AJ Pronos sur les 5
            derniers mois. Ils ne constituent en aucun cas une promesse de
            gains futurs. Les paris sportifs comportent des risques d&apos;addiction
            et de pertes financières. Service réservé aux +18 ans. Joueurs Info
            Service&nbsp;:{" "}
            <a href="tel:0974751313">09 74 75 13 13</a> ·{" "}
            <a href="https://www.joueurs-info-service.fr" rel="noopener noreferrer" target="_blank">
              joueurs-info-service.fr
            </a>
          </p>
        </div>
      </section>

      <Transparency />

      <section className="resultats-foot-section">
        <div className="wrap">
          <header className="resultats-foot-head">
            <span className="eyebrow">Méthode &amp; preuve</span>
            <h2>Comment on tient ces <em>chiffres</em>&nbsp;?</h2>
            <p>
              Chaque pari publié est tracé&nbsp;: capture d&apos;écran Winamax
              archivée, date, prédiction, cote, résultat. Aucune ligne
              n&apos;est éditée a posteriori. C&apos;est ce qui rend notre
              historique vérifiable.
            </p>
          </header>
          <div className="resultats-foot-actions">
            <Link href="/methode" className="page-cta-btn page-cta-btn--light">
              Découvrir notre méthode →
            </Link>
            <Link href="/#tarifs" className="page-cta-link page-cta-link--dark">
              ou voir les abonnements
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
