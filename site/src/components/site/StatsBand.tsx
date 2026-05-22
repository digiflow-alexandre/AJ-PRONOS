"use client";

import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { stats } from "@/lib/data";

export function StatsBand() {
  return (
    <section className="stats-bar" aria-label="Indicateurs">
      <div className="wrap">
        <div className="stats-grid">
          {stats.map((s, idx) => (
            <Reveal key={s.label} as="div" className="stat" delay={idx * 80}>
              <CountUp
                className={`stat-num mono${s.accent ? " accent" : ""}`}
                value={s.value}
                prefix={s.prefix}
                suffix={s.suffix}
                decimals={s.decimals}
              />
              <span className="stat-label">{s.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsBand;
