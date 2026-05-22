"use client";

import { Reveal } from "@/components/ui/Reveal";
import { JSX, useEffect, useRef } from "react";

/* SVG icons sport — clean line icons, color via currentColor */
const FootballIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 7l4 3-1.5 4.5h-5L8 10l4-3z" />
    <path d="M12 7V3M16 10l3.5-1.5M14.5 14.5L17 17.5M9.5 14.5L7 17.5M8 10L4.5 8.5" />
  </svg>
);

const BasketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2v20" />
    <path d="M5 5c3.5 4 10.5 4 14 0M5 19c3.5-4 10.5-4 14 0" />
  </svg>
);

const TennisIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M3 12c0-5.5 4-9 9-9M21 12c0 5.5-4 9-9 9" />
  </svg>
);

const MmaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 11V5a3 3 0 1 1 6 0v6h2a4 4 0 0 1 4 4v3a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3" />
    <path d="M14 11h-6" />
  </svg>
);

/* SVG icons méthode — minimalist line icons */
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M7 15l4-4 4 3 5-7" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l9 4v6c0 5-3.5 8.5-9 10-5.5-1.5-9-5-9-10V6l9-4z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="2" width="10" height="20" rx="2.5" />
    <path d="M11 18h2" />
  </svg>
);

type Card =
  | { kind: "image"; src: string; alt: string }
  | { kind: "info"; icon: () => JSX.Element; label: string; sub?: string };

/* Row 1 — alternate sport IMAGE / sport INFO icon. Order : img, info, img, info, ... */
const row1: Card[] = [
  { kind: "image", src: "/sports/football.png", alt: "Football" },
  { kind: "info", icon: FootballIcon, label: "Football", sub: "Ligue 1" },
  { kind: "image", src: "/sports/basket.png", alt: "Basketball" },
  { kind: "info", icon: BasketIcon, label: "Basket", sub: "NBA" },
  { kind: "image", src: "/sports/tennis.png", alt: "Tennis" },
  { kind: "info", icon: TennisIcon, label: "Tennis", sub: "ATP" },
  { kind: "image", src: "/sports/mma.png", alt: "MMA" },
  { kind: "info", icon: MmaIcon, label: "MMA", sub: "UFC" },
];

/* Row 2 — alterne sport IMAGE (rugby/hockey/NFL/baseball) / méthode INFO icon.
   8 cards total : 4 images + 4 infos, ordre : img, info, img, info, ... */
const row2: Card[] = [
  { kind: "image", src: "/sports/rugby.png", alt: "Rugby" },
  { kind: "info", icon: ChartIcon, label: "Compositions", sub: "Analysées" },
  { kind: "image", src: "/sports/hockey.png", alt: "Hockey" },
  { kind: "info", icon: ShieldIcon, label: "Blessures", sub: "Vérifiées" },
  { kind: "image", src: "/sports/nfl.png", alt: "Football US" },
  { kind: "info", icon: TargetIcon, label: "Value bets", sub: "Détectés" },
  { kind: "image", src: "/sports/baseball.png", alt: "Baseball" },
  { kind: "info", icon: PhoneIcon, label: "WhatsApp", sub: "Envoi direct" },
];

/* Convertit "Nvw" en clamp(min px, Nvw, max px) — sur mobile le min px tient
   le nuage à une taille visible (≈2× le vw natif), sur desktop le vw passe. */
function responsiveWidth(value: string): string {
  const vw = parseFloat(value);
  if (Number.isNaN(vw)) return value;
  const minPx = Math.round(vw * 8);
  const maxPx = Math.round(vw * 16);
  return `clamp(${minPx}px, ${vw}vw, ${maxPx}px)`;
}

function renderCard(card: Card, key: string) {
  if (card.kind === "image") {
    return (
      <div key={key} className="marquee-card marquee-card--image">
        <img src={card.src} alt="" aria-hidden="true" loading="lazy" />
      </div>
    );
  }
  const Icon = card.icon;
  return (
    <div key={key} className="marquee-card marquee-card--info">
      <div className="marquee-card-icon">
        <Icon />
      </div>
      <strong>{card.label}</strong>
      {card.sub && <span>{card.sub}</span>}
    </div>
  );
}

export function Showcase() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Scroll-driven parallax : on track la position de la section et on update
     une CSS var --scroll-offset (en px) qui pilote le translate de chaque cloud.
     Chaque cloud a son propre multiplicateur (mul) selon sa couche pour effet depth. */
  useEffect(() => {
    let raf: number | null = null;
    const update = () => {
      raf = null;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Offset en px : distance entre le centre du viewport et le centre de la section
      // Négatif = section sous le viewport, positif = section au-dessus
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = vh / 2;
      const offset = viewportCenter - sectionCenter;
      section.style.setProperty("--scroll-offset", `${offset}px`);
    };
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="showcase" aria-label="Sports couverts et méthode">
      <div className="showcase-stage">
        {/* Row 1 — sports stadium : alterne IMAGE / ICON. Scroll vers gauche.
            4× duplication → track toujours > viewport, jamais de trou */}
        <div className="marquee-row">
          <div className="marquee-track">
            {[...row1, ...row1, ...row1, ...row1].map((c, i) => renderCard(c, `r1-${i}`))}
          </div>
        </div>

        {/* Row 2 — alterne sport IMAGE / méthode INFO. Scroll vers droite (sens inverse) */}
        <div className="marquee-row">
          <div className="marquee-track marquee-track--reverse">
            {[...row2, ...row2, ...row2, ...row2].map((c, i) => renderCard(c, `r2-${i}`))}
          </div>
        </div>

        {/* iPhone mockup centré au-dessus */}
        <img
          src="/hero-mockup.png"
          alt=""
          aria-hidden="true"
          className="showcase-phone"
        />
      </div>

      <Reveal as="div" className="showcase-rating">
        <span className="showcase-rating-star" aria-hidden="true">★</span>
        <span>Note 4,9 · Basée sur 340 retours membres</span>
      </Reveal>

      {/* Mer de nuages : ~17 PNG indépendants, 4 couches de profondeur, overlap continu */}
      <div className="showcase-clouds" aria-hidden="true">
        {cloudInstances.map((c, i) => (
          <img
            key={i}
            className="cloud"
            src={`/decorations/cloud-${c.src}.png`}
            alt=""
            loading="lazy"
            style={
              {
                left: c.left,
                right: c.right,
                bottom: c.bottom,
                width: responsiveWidth(c.width),
                opacity: c.opacity,
                // Multiplier de parallax — plus la couche est en avant (couche 1 / bottom),
                // plus elle bouge vite au scroll. Effet "on traverse les nuages".
                "--mul": c.mul,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </section>
  );
}

/* 4 couches de nuages (back → front) avec overlap pour mer continue.
   Chaque cloud : src 1-4 (PNG distincts), position relative à .showcase-clouds, taille viewport-vw, opacity pour profondeur. */
type CloudInstance = {
  src: 1 | 2 | 3 | 4;
  left?: string;
  right?: string;
  bottom: string;
  width: string;
  opacity: number;
  /* Multiplicateur de parallax scroll (0 = immobile, 0.2 = bouge bcp).
     Couche 1 (proche, foreground) = mul élevé. Couche 5 (loin) = mul faible. */
  mul: number;
};

/* mul = multiplicateur de parallax scroll.
   Couches du bas (proches = foreground) = mul élevé → bougent vite au scroll.
   Couches du haut (loin = background) = mul faible → bougent peu. */
const C1 = 0.14, C2 = 0.10, C3 = 0.07, C4 = 0.04, C5 = 0.02;

const cloudInstances: CloudInstance[] = [
  // Couche 1 — débordent dans Method, foreground proche
  { src: 3, left: "-8%",  bottom: "-14%", width: "26vw", opacity: 0.95, mul: C1 },
  { src: 2, left: "0%",   bottom: "-10%", width: "20vw", opacity: 0.93, mul: C1 },
  { src: 1, left: "6%",   bottom: "-18%", width: "22vw", opacity: 0.92, mul: C1 },
  { src: 4, left: "14%",  bottom: "-8%",  width: "18vw", opacity: 0.94, mul: C1 },
  { src: 2, left: "20%",  bottom: "-12%", width: "20vw", opacity: 0.95, mul: C1 },
  { src: 3, left: "26%",  bottom: "-6%",  width: "18vw", opacity: 0.93, mul: C1 },
  { src: 4, left: "32%",  bottom: "-16%", width: "22vw", opacity: 0.92, mul: C1 },
  { src: 1, left: "40%",  bottom: "-8%",  width: "18vw", opacity: 0.94, mul: C1 },
  { src: 3, left: "46%",  bottom: "-14%", width: "24vw", opacity: 0.94, mul: C1 },
  { src: 2, left: "54%",  bottom: "-6%",  width: "18vw", opacity: 0.93, mul: C1 },
  { src: 1, left: "60%",  bottom: "-18%", width: "22vw", opacity: 0.92, mul: C1 },
  { src: 4, left: "67%",  bottom: "-8%",  width: "18vw", opacity: 0.94, mul: C1 },
  { src: 2, left: "74%",  bottom: "-12%", width: "20vw", opacity: 0.95, mul: C1 },
  { src: 3, left: "82%",  bottom: "-6%",  width: "18vw", opacity: 0.93, mul: C1 },
  { src: 4, right: "-6%", bottom: "-15%", width: "24vw", opacity: 0.93, mul: C1 },

  // Couche 2
  { src: 2, left: "-3%",  bottom: "14%",  width: "18vw", opacity: 0.9,  mul: C2 },
  { src: 4, left: "5%",   bottom: "11%",  width: "16vw", opacity: 0.88, mul: C2 },
  { src: 3, left: "12%",  bottom: "17%",  width: "20vw", opacity: 0.88, mul: C2 },
  { src: 1, left: "20%",  bottom: "11%",  width: "16vw", opacity: 0.9,  mul: C2 },
  { src: 1, left: "28%",  bottom: "15%",  width: "18vw", opacity: 0.9,  mul: C2 },
  { src: 3, left: "35%",  bottom: "12%",  width: "17vw", opacity: 0.88, mul: C2 },
  { src: 4, left: "42%",  bottom: "18%",  width: "20vw", opacity: 0.87, mul: C2 },
  { src: 2, left: "50%",  bottom: "11%",  width: "16vw", opacity: 0.89, mul: C2 },
  { src: 2, left: "57%",  bottom: "16%",  width: "18vw", opacity: 0.9,  mul: C2 },
  { src: 4, left: "64%",  bottom: "12%",  width: "16vw", opacity: 0.88, mul: C2 },
  { src: 3, left: "70%",  bottom: "18%",  width: "20vw", opacity: 0.88, mul: C2 },
  { src: 1, right: "-3%", bottom: "15%",  width: "18vw", opacity: 0.9,  mul: C2 },

  // Couche 3
  { src: 1, left: "2%",   bottom: "34%",  width: "16vw", opacity: 0.78, mul: C3 },
  { src: 4, left: "11%",  bottom: "31%",  width: "14vw", opacity: 0.76, mul: C3 },
  { src: 3, left: "20%",  bottom: "37%",  width: "18vw", opacity: 0.75, mul: C3 },
  { src: 2, left: "28%",  bottom: "31%",  width: "14vw", opacity: 0.77, mul: C3 },
  { src: 2, left: "38%",  bottom: "35%",  width: "16vw", opacity: 0.78, mul: C3 },
  { src: 1, left: "46%",  bottom: "32%",  width: "14vw", opacity: 0.76, mul: C3 },
  { src: 4, left: "54%",  bottom: "38%",  width: "18vw", opacity: 0.74, mul: C3 },
  { src: 3, left: "63%",  bottom: "32%",  width: "14vw", opacity: 0.76, mul: C3 },
  { src: 1, left: "72%",  bottom: "35%",  width: "16vw", opacity: 0.77, mul: C3 },
  { src: 3, right: "-2%", bottom: "37%",  width: "16vw", opacity: 0.75, mul: C3 },

  // Couche 4
  { src: 2, left: "10%",  bottom: "55%",  width: "12vw", opacity: 0.58, mul: C4 },
  { src: 4, left: "19%",  bottom: "52%",  width: "12vw", opacity: 0.55, mul: C4 },
  { src: 1, left: "28%",  bottom: "58%",  width: "14vw", opacity: 0.55, mul: C4 },
  { src: 3, left: "39%",  bottom: "53%",  width: "12vw", opacity: 0.55, mul: C4 },
  { src: 4, left: "48%",  bottom: "60%",  width: "14vw", opacity: 0.52, mul: C4 },
  { src: 2, left: "57%",  bottom: "54%",  width: "12vw", opacity: 0.56, mul: C4 },
  { src: 3, left: "65%",  bottom: "57%",  width: "12vw", opacity: 0.55, mul: C4 },
  { src: 2, right: "8%",  bottom: "59%",  width: "12vw", opacity: 0.55, mul: C4 },

  // Couche 5
  { src: 1, left: "8%",   bottom: "72%",  width: "10vw", opacity: 0.4,  mul: C5 },
  { src: 4, left: "20%",  bottom: "75%",  width: "10vw", opacity: 0.4,  mul: C5 },
  { src: 1, left: "35%",  bottom: "76%",  width: "11vw", opacity: 0.38, mul: C5 },
  { src: 3, left: "50%",  bottom: "78%",  width: "12vw", opacity: 0.38, mul: C5 },
  { src: 2, left: "63%",  bottom: "74%",  width: "10vw", opacity: 0.4,  mul: C5 },
  { src: 2, right: "22%", bottom: "76%",  width: "10vw", opacity: 0.4,  mul: C5 },
  { src: 4, right: "8%",  bottom: "72%",  width: "10vw", opacity: 0.4,  mul: C5 },
];

export default Showcase;
