import { Reveal } from "@/components/ui/Reveal";
import { methodSteps } from "@/lib/data";

export function Method() {
  return (
    <section id="methode" className="method-section">
      <div className="method-bg" aria-hidden="true" />
      <div className="method-overlay" aria-hidden="true" />

      <div className="wrap method-wrap">
        <div className="section-head method-head">
          <Reveal as="span" className="eyebrow">Notre methode</Reveal>
          <Reveal as="h2" delay={80}>Trois etapes, une seule promesse.</Reveal>
          <Reveal as="p" className="lead" delay={160}>
            On ne te vend pas une &quot;intuition&quot;. On t&apos;expose une méthode,
            de la collecte des données jusqu&apos;à la notification sur ton téléphone.
          </Reveal>
        </div>

        <div className="method-fan">
          {methodSteps.map((step, idx) => (
            <Reveal
              key={step.number}
              as="article"
              className={`method-card method-card--pos-${idx} ${step.image ? "method-card--img" : "method-card--text"}`}
              delay={idx * 120}
            >
              {step.image ? (
                <img
                  src={step.image}
                  alt={step.alt ?? ""}
                  className="method-card-img"
                  loading="lazy"
                />
              ) : (
                <>
                  <div className="method-card-top">
                    <span className="method-card-num">{step.number}</span>
                    <span className="method-card-eyebrow">{step.eyebrow}</span>
                  </div>
                  <h3 className="method-card-title">{step.title}</h3>
                  <p className="method-card-body">{step.body}</p>
                  <div className="method-card-tags">
                    {step.tags.map((t) => (
                      <span key={t} className="method-card-tag">{t}</span>
                    ))}
                  </div>
                </>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Method;
