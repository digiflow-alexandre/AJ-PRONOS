import { Reveal } from "@/components/ui/Reveal";

export function Intro() {
  return (
    <section className="intro" aria-label="Notre approche">
      <div className="wrap">
        <Reveal as="h2" className="intro-heading">
          On lit compositions{" "}
          <span className="intro-emoji" aria-hidden="true">⚽</span>, blessures{" "}
          <span className="intro-emoji" aria-hidden="true">🏥</span>, forme et cotes{" "}
          <span className="intro-emoji" aria-hidden="true">📊</span> — chaque pari passé au crible avant qu'on tranche{" "}
          <span className="intro-emoji" aria-hidden="true">🎯</span>. Verdict dans ton app{" "}
          <span className="intro-emoji" aria-hidden="true">📱</span>.
        </Reveal>
        <Reveal as="p" className="intro-sub" delay={100}>
          Conçu par 2 parieurs qui en avaient marre de perdre au feeling.
        </Reveal>
        <Reveal as="div" className="intro-pills" delay={200}>
          <span className="intro-pill">#Foot</span>
          <span className="intro-pill">#Tennis</span>
          <span className="intro-pill">#IA-Pro</span>
          <span className="intro-pill">#VIP-50places</span>
        </Reveal>
      </div>
    </section>
  );
}

export default Intro;
