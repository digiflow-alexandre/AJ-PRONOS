import { Reveal } from "@/components/ui/Reveal";

export function CtaFinal() {
  return (
    <section className="section cta-final">
      <div className="cta-final-bg" aria-hidden="true" />
      <div className="wrap">
        <Reveal as="span" className="eyebrow cta-final-eyebrow">On y va ?</Reveal>
        <Reveal as="h2" delay={80}>
          Pret a parier
          <br />
          <em>avec methode</em> ?
        </Reveal>
        <Reveal as="p" className="cta-final-sub" delay={140}>
          Sans engagement. Resiliable en un clic. Le pack Decouverte est gratuit.
        </Reveal>
        <Reveal as="div" delay={200} className="cta-final-actions">
          <a href="#tarifs" className="cta-final-btn">
            Commencer gratuitement
            <span aria-hidden="true" className="cta-final-btn-arrow">→</span>
          </a>
          <a href="#pronos" className="cta-final-secondary">
            Voir les resultats publics
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export default CtaFinal;
