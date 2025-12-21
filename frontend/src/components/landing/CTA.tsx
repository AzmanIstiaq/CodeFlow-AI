import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";

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
