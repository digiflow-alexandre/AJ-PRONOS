"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { faqItems } from "@/lib/data";

export function Faq() {
  // Premier ouvert par défaut, comme dans la maquette.
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) =>
    setOpenIdx((cur) => (cur === idx ? null : idx));

  return (
    <section id="faq" className="section">
      <div className="wrap">
        <div className="section-head">
          <Reveal as="span" className="eyebrow">FAQ</Reveal>
          <Reveal as="h2" delay={80}>Les questions qu&apos;on nous pose.</Reveal>
        </div>

        <Reveal as="div" className="faq-list">
          {faqItems.map((item, idx) => {
            const open = openIdx === idx;
            const panelId = `faq-panel-${idx}`;
            const btnId = `faq-button-${idx}`;
            return (
              <div
                key={item.question}
                className="faq-item"
                data-open={open ? "true" : "false"}
              >
                <button
                  id={btnId}
                  type="button"
                  className="faq-q"
                  aria-controls={panelId}
                  aria-expanded={open}
                  onClick={() => toggle(idx)}
                >
                  <span>{item.question}</span>
                  <span className="faq-chev" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className="faq-a"
                  style={{ maxHeight: open ? "240px" : "0px" }}
                >
                  <div className="faq-a-inner">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

export default Faq;
