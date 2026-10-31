import { CorporateSection } from "@/components/landing/CorporateSection";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";
import {
  AccessSection,
  FaqSection,
  ReviewsSection,
  RulesSection,
  ValueSection,
} from "@/components/landing/StaticSections";
import { PageShell } from "@/components/layout/PageShell";

export default function LandingPage() {
  return (
    <PageShell>
      <Hero />
      <ValueSection />
      <AccessSection />
      <Pricing />
      <RulesSection />
      <ReviewsSection />
      <CorporateSection />
      <FaqSection />
    </PageShell>
  );
}
