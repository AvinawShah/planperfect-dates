import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import HowItWorks from "@/components/landing/HowItWorks";
import EventsPreview from "@/components/landing/EventsPreview";
import DealsPreview from "@/components/landing/DealsPreview";
import Testimonials from "@/components/landing/Testimonials";
import FinalCTA from "@/components/landing/FinalCTA";

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <EventsPreview />
      <DealsPreview />
      <Testimonials />
      <FinalCTA />
    </main>
    <Footer />
  </div>
);

export default Index;
