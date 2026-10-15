import { CtaBand } from "./cta-band";
import { FeatureBento } from "./feature-bento";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Principles } from "./principles";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";

/** The whole logged-out landing page, top to bottom. */
export function Landing() {
  return (
    <>
      <SiteNav />
      <main id="main" className="flex-1">
        <Hero />
        <HowItWorks />
        <FeatureBento />
        <Principles />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
