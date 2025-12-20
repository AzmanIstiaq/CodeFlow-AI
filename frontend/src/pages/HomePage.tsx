import Hero from "../components/landing/Hero";
import Preview from "../components/landing/Preview";
import Features from "../components/landing/Features";
import CTA from "../components/landing/CTA";
import { Container } from "react-bootstrap";

export default function HomePage() {
  return (
    <Container fluid className="homepage-wrapper p-0">
      <Hero />
      <Preview />
      <Features />
      <CTA />
    </Container>
  );
}
