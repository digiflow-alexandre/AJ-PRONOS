import { Reveal } from "@/components/ui/Reveal";
import { HeroMockup } from "@/components/site/HeroMockup";

export function Hero() {
  return (
    <>
      <span id="top" />
      <header className="hero">
        <div className="hero-fade" aria-hidden="true" />
        <div className="wrap hero-content">
          <Reveal as="span" className="eyebrow-pill">
            <span className="eyebrow-pill__badge">Nouveau</span>
            Conseil en paris sportifs
          </Reveal>
          <Reveal as="h1" delay={80}>
            Le pari sportif, avec methode.
          </Reveal>
          <Reveal as="p" className="lead" delay={160}>
            On analyse compositions, blessures, forme et cotes — pari par pari.
            Chaque prono est validé à la main avant d&apos;arriver dans ton app.
          </Reveal>
          <Reveal as="div" className="hero-ctas" delay={240}>
            <a href="#methode" className="btn btn-primary">
              Decouvrir la methode
            </a>
            <a href="#pronos" className="btn btn-secondary">
              <svg className="btn-secondary__icon" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 2l7 4-7 4V2z" />
              </svg>
              Voir un prono gratuit
            </a>
          </Reveal>
        </div>
        <HeroMockup />
        <span className="scroll-indicator" aria-hidden="true">
          Scroll
        </span>
      </header>
    </>
  );
}

export default Hero;
