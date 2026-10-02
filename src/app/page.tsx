import { Navbar } from "@/components/dreamforge/navbar";
import { Hero } from "@/components/dreamforge/hero";
import { ShowcaseGallery } from "@/components/dreamforge/showcase-gallery";
import { Features, HowItWorks } from "@/components/dreamforge/features-and-how";
import { CinematicShowcase } from "@/components/dreamforge/cinematic-showcase";
import { UseCases } from "@/components/dreamforge/use-cases";
import { Pricing } from "@/components/dreamforge/pricing";
import { Testimonials } from "@/components/dreamforge/testimonials";
import { FinalCTA } from "@/components/dreamforge/final-cta";
import { Footer } from "@/components/dreamforge/footer";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ShowcaseGallery />
        <HowItWorks />
        <Features />
        <CinematicShowcase />
        <UseCases />
        <Pricing />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
