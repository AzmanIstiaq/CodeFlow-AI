/**
 * Call To Action Section
 *
 * Purpose:
 * - Encourage users to launch the visual builder.
 *
 * Role in the system:
 * - Final conversion point on the landing page.
 *
 * Key responsibilities:
 * - Present a clear headline and a single primary action.
 *
 * Important constraints and assumptions:
 * - Navigation is handled by the router; no analytics are wired here.
 */

import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";

// ================================
// Component
// ================================
/**
 * Landing page CTA with a direct route into the builder.
 */
export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <Container className="cta-container">
        <Row>
          <Col className="text-center">
            <h2 className="cta-headline">
              Ready to Build Your First Workflow?
            </h2>
            <button
              onClick={() => navigate("/pageBuilder")}
              className="btn-primary btn-large"
            >
              Launch Visual Builder
            </button>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
