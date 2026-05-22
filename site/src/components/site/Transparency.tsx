"use client";

import { useState, useMemo, useEffect } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { bets, monthsList, monthlySummary, type BetMonth, type Bet } from "@/lib/data";

const sportLabel: Record<NonNullable<Bet["sport"]>, string> = {
  foot: "⚽",
  tennis: "🎾",
  basket: "🏀",
  mma: "🥊",
};

const sportName: Record<NonNullable<Bet["sport"]>, string> = {
  foot: "Football",
  tennis: "Tennis",
  basket: "Basket",
  mma: "MMA",
};

const sportColor: Record<NonNullable<Bet["sport"]>, string> = {
  foot: "#FFFFFF",
  tennis: "#FFD24D",
  basket: "#FFAA5C",
  mma: "#FF7373",
};

const sportGradient: Record<NonNullable<Bet["sport"]>, string> = {
  foot:   "linear-gradient(180deg, #2D8659 0%, #0F3D29 100%)",
  tennis: "linear-gradient(180deg, #B8941F 0%, #4A3A0F 100%)",
  basket: "linear-gradient(180deg, #C2532E 0%, #4A1F12 100%)",
  mma:    "linear-gradient(180deg, #7E2E2E 0%, #2B0E0E 100%)",
};

/* Cardinal/Catmull-Rom-style smooth path entre points */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function Transparency() {
  const [active, setActive] = useState<BetMonth>("mai");
  const [zoomBet, setZoomBet] = useState<Bet | null>(null);

  /* Lock body scroll quand modal ouvert + close on Escape */
  useEffect(() => {
    if (!zoomBet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomBet(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomBet]);

  const filteredBets = useMemo(
    () => bets.filter((b) => b.month === active),
    [active],
  );
  const summary = monthlySummary[active];
  const winRate = Math.round((summary.wins / summary.total) * 100);
  const activeLabel = monthsList.find((m) => m.key === active)?.label ?? "";
  const activeIdx = monthsList.findIndex((m) => m.key === active);

  /* Sport breakdown du mois actif */
  const sportBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredBets.forEach((b) => {
      if (b.sport) counts[b.sport] = (counts[b.sport] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([sport, count]) => ({
        sport: sport as keyof typeof sportLabel,
        count,
        pct: (count / total) * 100,
      }));
  }, [filteredBets]);

  /* Données bar chart : ROI par mois */
  const rois = monthsList.map((m) => monthlySummary[m.key].roi);
  const maxRoi = Math.max(...rois) * 1.15;

  /* Données line chart : ROI cumulé */
  const cumulativeROI: number[] = [];
  rois.reduce((acc, r) => {
    const v = acc + r;
    cumulativeROI.push(v);
    return v;
  }, 0);
  const maxCum = Math.max(...cumulativeROI);
  const linePoints: [number, number][] = cumulativeROI.map((v, i) => {
    const x = (i / (cumulativeROI.length - 1)) * 380 + 10;
    const y = 110 - (v / maxCum) * 80;
    return [x, y];
  });
  const linePath = smoothPath(linePoints);
  /* Ghost line (variation moins lisse pour effet) */
  const ghostPoints: [number, number][] = cumulativeROI.map((v, i) => {
    const x = (i / (cumulativeROI.length - 1)) * 380 + 10;
    const y = 110 - (v / maxCum) * 75 + 8;
    return [x, y];
  });
  const ghostPath = smoothPath(ghostPoints);

  /* Donut win rate */
  const donutR = 70;
  const donutCirc = 2 * Math.PI * donutR;
  const donutFill = (winRate / 100) * donutCirc;

  /* Trend vs mois précédent — masqué sur le premier mois (pas de référence) */
  const hasPrevMonth = activeIdx > 0;
  const prevTotal = hasPrevMonth ? monthlySummary[monthsList[activeIdx - 1].key].total : 0;
  const totalTrend = summary.total - prevTotal;
  const totalTrendPct = prevTotal ? ((totalTrend / prevTotal) * 100).toFixed(0) : "0";

  return (
    <section id="pronos" className="tx-section">
      <div className="wrap tx-wrap">
        <div className="tx-section-head">
          <Reveal as="span" className="eyebrow">Transparence ROI</Reveal>
          <Reveal as="h2" delay={80}>
            Historique des pronos, <span className="tx-h2-italic">public</span>.
          </Reveal>
          <Reveal as="p" className="lead" delay={160}>
            Tous les paris envoyés à nos membres, mois par mois. Aucune ligne
            retirée — gains et pertes affichés bruts.
          </Reveal>
        </div>

        {/* ============ BENTO DASHBOARD ============ */}
        <div className="bento">
          {/* CARD HERO : donut + sport breakdown */}
          <Reveal as="article" key={`hero-${active}`} className="bento-card bento-hero" delay={120}>
            <div className="bento-card-head">
              <h3 className="bento-card-title">Performance {activeLabel}</h3>
              <span className="bento-trend bento-trend--up">
                <span className="bento-trend-arrow">↗</span>
                +{summary.roi.toFixed(1)}%
              </span>
            </div>

            <div className="bento-donut">
              <svg viewBox="0 0 200 200" className="bento-donut-svg">
                <defs>
                  <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle cx="100" cy="100" r={donutR} stroke="rgba(255,255,255,0.18)" strokeWidth="22" fill="none" />
                {/* Fill */}
                <circle
                  cx="100" cy="100" r={donutR}
                  stroke="url(#donut-grad)"
                  strokeWidth="22"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={donutCirc}
                  strokeDashoffset={donutCirc - donutFill}
                  transform="rotate(-90 100 100)"
                  style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
              </svg>
              <div className="bento-donut-center">
                <span className="bento-donut-val">{summary.wins}</span>
                <span className="bento-donut-label">paris gagnants</span>
                <span className="bento-donut-sub">sur {summary.total}</span>
              </div>
            </div>

            <div className="bento-breakdown">
              {sportBreakdown.map((s) => (
                <div key={s.sport} className="bento-bk-row">
                  <span className="bento-bk-left">
                    <span className="bento-bk-dot" style={{ background: sportColor[s.sport] }} />
                    <span className="bento-bk-emoji">{sportLabel[s.sport]}</span>
                    {sportName[s.sport]}
                  </span>
                  <span className="bento-bk-pct">{s.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* CARD BAR CHART : ROI mensuel (interactif → filtre la galerie) */}
          <Reveal as="article" className="bento-card bento-bar" delay={180}>
            <div className="bento-card-head">
              <h3 className="bento-card-title">ROI mensuel</h3>
              <span className="bento-meta">Clique sur un mois</span>
            </div>
            <div className="bento-chart">
              <div className="bento-bar-yaxis">
                <span>30%</span>
                <span>20%</span>
                <span>10%</span>
                <span>0</span>
              </div>
              <div className="bento-bars">
                {monthsList.map((m) => {
                  const r = monthlySummary[m.key].roi;
                  const h = (r / maxRoi) * 100;
                  const isActive = m.key === active;
                  return (
                    <button
                      key={m.key}
                      className={`bento-bar-col ${isActive ? "bento-bar-col--active" : ""}`}
                      onClick={() => setActive(m.key)}
                      aria-label={`Voir les pronos de ${m.label}`}
                    >
                      <span className="bento-bar-val">{r.toFixed(1)}%</span>
                      <span
                        className="bento-bar-fill"
                        style={{ height: `${h}%` }}
                      />
                      <span className="bento-bar-label">{m.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* CARD LINE CHART : ROI cumulé trend */}
          <Reveal as="article" className="bento-card bento-line" delay={240}>
            <div className="bento-card-head">
              <h3 className="bento-card-title">ROI cumulé · trend</h3>
              <span className="bento-trend bento-trend--up">
                <span className="bento-trend-arrow">↗</span>
                +{maxCum.toFixed(0)}% YTD
              </span>
            </div>
            <div className="bento-line-chart">
              <svg viewBox="0 0 400 130" className="bento-line-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Aire sous la courbe */}
                <path
                  d={`${linePath} L 390,130 L 10,130 Z`}
                  fill="url(#line-area)"
                />
                {/* Ghost line subtile */}
                <path
                  d={ghostPath}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Courbe principale */}
                <path
                  d={linePath}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Points */}
                {linePoints.map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={i === activeIdx ? 5 : 3}
                    fill={i === activeIdx ? "#FFD24D" : "#FFFFFF"}
                    stroke="#0A0A0A"
                    strokeWidth={i === activeIdx ? 2 : 1.5}
                  />
                ))}
              </svg>
              <div className="bento-line-xaxis">
                {monthsList.map((m) => (
                  <span key={m.key} className={m.key === active ? "is-active" : ""}>{m.short}</span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* CARD STAT : Paris envoyés */}
          <Reveal as="article" key={`stat-l-${active}`} className="bento-card bento-stat" delay={300}>
            <div className="bento-card-head">
              <h3 className="bento-stat-title">Paris envoyés</h3>
              {hasPrevMonth && (
                <span className={`bento-trend ${totalTrend >= 0 ? "bento-trend--up" : "bento-trend--down"}`}>
                  <span className="bento-trend-arrow">{totalTrend >= 0 ? "↗" : "↘"}</span>
                  {totalTrend >= 0 ? "+" : ""}{totalTrendPct}%
                </span>
              )}
            </div>
            <span className="bento-stat-val">{summary.total}</span>
          </Reveal>

          {/* CARD STAT : Cote moyenne */}
          <Reveal as="article" key={`stat-r-${active}`} className="bento-card bento-stat" delay={340}>
            <div className="bento-card-head">
              <h3 className="bento-stat-title">Cote moyenne</h3>
              <span className="bento-meta">{winRate}% réussite</span>
            </div>
            <span className="bento-stat-val">{summary.avgOdd}</span>
          </Reveal>
        </div>

        {/* Compteur pronos pour le mois actif */}
        <div className="tx-count-row">
          <span className="tx-count-line" />
          <span className="tx-count-text">
            <strong>{filteredBets.length}</strong> pronos · {activeLabel}
          </span>
          <span className="tx-count-line" />
        </div>
      </div>

      {/* Modal zoom : image full size sur clic */}
      {zoomBet && (
        <div
          className="tx-zoom"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomBet(null)}
        >
          <button
            type="button"
            className="tx-zoom-close"
            onClick={() => setZoomBet(null)}
            aria-label="Fermer"
          >
            ×
          </button>
          {zoomBet.image && (
            <img
              src={zoomBet.image}
              alt={`Prono du ${zoomBet.day} ${monthsList.find((m) => m.key === zoomBet.month)?.label.toLowerCase()}`}
              className="tx-zoom-img"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Galerie (carrousel inchangé) */}
      <div key={`gallery-${active}`} className="tx-carousel">
        <div className="tx-carousel-track">
          {filteredBets.map((bet, i) => {
            const monthLabel = monthsList.find((m) => m.key === bet.month)?.label.toLowerCase();
            return (
              <div key={`${bet.day}-${bet.match}-${i}`} className="tx-tc-wrap" style={{ animationDelay: `${i * 50}ms` }}>
                <button
                  type="button"
                  className={`tx-tc tx-tc--${bet.result}`}
                  onClick={() => bet.image && setZoomBet(bet)}
                  style={{
                    background: bet.image
                      ? undefined
                      : (bet.sport ? sportGradient[bet.sport] : "linear-gradient(180deg, #2D2D2D 0%, #0F0F0F 100%)"),
                    cursor: bet.image ? "zoom-in" : "default",
                  }}
                  aria-label={bet.image ? `Voir le prono du ${bet.day} ${monthLabel} en grand` : undefined}
                >
                  {bet.image ? (
                    <img src={bet.image} alt={`Prono du ${bet.day} ${monthLabel}`} className="tx-tc-img" loading="lazy" />
                  ) : (
                    <>
                      <span className="tx-tc-shade" aria-hidden="true" />
                      {bet.sport && (
                        <span className="tx-tc-sport-deco" aria-hidden="true">{sportLabel[bet.sport]}</span>
                      )}
                      <header className="tx-tc-top">
                        <div className="tx-tc-date">
                          <strong>{bet.day}</strong>
                          <span>{monthsList.find((m) => m.key === bet.month)?.short.toUpperCase()}</span>
                        </div>
                        <span className={`tx-tc-stamp tx-tc-stamp--${bet.result}`}>
                          {bet.result === "win" ? "✓ Win" : "✕ Loss"}
                        </span>
                      </header>
                      <footer className="tx-tc-bottom">
                        <span className="tx-tc-match">{bet.match}</span>
                        <span className="tx-tc-pred">{bet.prediction}</span>
                        <div className="tx-tc-meta">
                          <span className="tx-tc-odd">@ {bet.odd}</span>
                          {bet.sport && (
                            <span className="tx-tc-sport-pill">{sportLabel[bet.sport]} {bet.sport.toUpperCase()}</span>
                          )}
                        </div>
                      </footer>
                    </>
                  )}
                </button>

                {/* Caption minimaliste sous la card */}
                <div className="tx-tc-caption">
                  <span className="tx-tc-cap-date">{bet.day} {monthLabel}</span>
                  <span className={`tx-tc-cap-status tx-tc-cap-status--${bet.result}`}>
                    {bet.result === "win" ? "Gagné" : "Perdu"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Transparency;
