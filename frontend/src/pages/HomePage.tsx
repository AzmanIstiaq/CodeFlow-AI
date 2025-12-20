import Hero from "../components/landing/Hero";
import Preview from "../components/landing/Preview";
import Features from "../components/landing/Features";
import CTA from "../components/landing/CTA";

export default function HomePage() {
  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      <Hero />
      <Preview />
      <Features />
      <CTA />
    </div>
  );
}
