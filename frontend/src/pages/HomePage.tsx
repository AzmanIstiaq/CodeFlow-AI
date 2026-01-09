/**
 * Landing Home Page
 *
 * Purpose:
 * - Present the product landing experience with hero, preview, and CTA sections.
 *
 * Role in the system:
 * - Serves as the primary entry point for marketing and discovery.
 *
 * Key responsibilities:
 * - Compose landing page sections in a deliberate visual order.
 *
 * Important constraints and assumptions:
 * - Uses a fluid container to allow full-bleed sections.
 * - Section order is significant for user narrative flow.
 */

import Hero from "../components/landing/Hero";
import Preview from "../components/landing/Preview";
import Features from "../components/landing/Features";
import CTA from "../components/landing/CTA";
import { Container } from "react-bootstrap";

// ================================
// Component
// ================================
/**
 * Landing page composition for marketing content.
 */
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
