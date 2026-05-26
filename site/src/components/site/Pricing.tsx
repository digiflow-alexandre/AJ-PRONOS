"use client";

/*
 * Pricing — frame PNG décoratif + contenu HTML sémantique par-dessus.
 * Note Stripe désactivé : tant qu'Alex n'a pas son SIRET, le href des CTA
 * pointe vers la liste d'attente, pas le checkout.
 */

import {
  Bell,
  BarChart3,
  FileSearch,
  Goal,
  Headphones,
  History,
  MessageCircle,
  Smartphone,
  TrendingUp,
  Trophy,
  UserX,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { pricingPlans } from "@/lib/data";

const WAITLIST_HREF = "#liste-attente";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  Bell,
  BarChart3,
  FileSearch,
  Goal,
  Headphones,
  History,
  MessageCircle,
  Smartphone,
  TrendingUp,
  Trophy,
  UserX,
};

export function Pricing() {
  return (
    <section id="tarifs" className="section pricing-section">
      <div className="wrap">
        <div className="section-head">
          <Reveal as="span" className="eyebrow">Tarifs</Reveal>
          <Reveal as="h2" delay={80}>Choisis ta carte.</Reveal>
          <Reveal as="p" className="lead" delay={160}>
            3 packs, sans engagement, résiliable en un clic. 7 jours offerts
            au premier inscription, le temps de te faire ton avis.
          </Reveal>
        </div>

        <div className="pricing-cards">
          {pricingPlans.map((plan, idx) => (
            <Reveal
              key={plan.tier}
              as="article"
              className={`pricing-card pricing-card--${plan.tier}${plan.featured ? " is-featured" : ""}`}
              delay={idx * 90}
              style={{ "--card-bg": `url(${plan.cardImage})` } as React.CSSProperties}
            >
              {plan.badge && (
                <span className="pricing-card-badge">{plan.badge}</span>
              )}

              <h3 className="pricing-card-name">{plan.name}</h3>

              <div className="pricing-card-price">
                <span className="pricing-card-amount">{plan.monthly}</span>
                {!plan.isFree && <span className="pricing-card-period">/ mois</span>}
                <span className="pricing-card-hint">{plan.hintMonthly}</span>
              </div>

              <ul className="pricing-card-features">
                {plan.features.map((f) => {
                  const Icon = f.icon ? iconMap[f.icon] : null;
                  return (
                    <li
                      key={f.text}
                      className={f.strong ? "is-strong" : undefined}
                    >
                      <span className="pricing-card-feature-icon" aria-hidden="true">
                        {Icon ? <Icon size={14} strokeWidth={2.25} /> : null}
                      </span>
                      <span className="pricing-card-feature-text">{f.text}</span>
                    </li>
                  );
                })}
              </ul>

              <a
                href={WAITLIST_HREF}
                className={`pricing-card-cta pricing-card-cta--${plan.ctaVariant}`}
                aria-label={`${plan.ctaLabel} — ouverture imminente`}
              >
                {plan.ctaLabel}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
