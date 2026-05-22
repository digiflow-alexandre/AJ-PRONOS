import { Hero } from "@/components/site/Hero";
import { Intro } from "@/components/site/Intro";
import { Showcase } from "@/components/site/Showcase";
import { Method } from "@/components/site/Method";
import { Transparency } from "@/components/site/Transparency";
import { Pricing } from "@/components/site/Pricing";
import { Faq } from "@/components/site/Faq";
import { CtaFinal } from "@/components/site/CtaFinal";

export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        <Intro />
        <Showcase />
        <Method />
        <Transparency />
        <Pricing />
        <Faq />
        <CtaFinal />
      </main>
    </>
  );
}
