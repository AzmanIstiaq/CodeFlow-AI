import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <Container fluid>
        <Row className="hero-container">
          <Col lg={6}>
            <div className="hero-content">
              <h1 className="hero-headline">
                <span className="typewriter"></span>
                <span className="placeholder-text" aria-hidden="true">
                  Build AI workflows visually.
                </span>
              </h1>
              <p className="hero-subtext">
                Design, run, and test AI workflows using a graph-driven engine.
                Local-first. Developer-friendly.
              </p>
              <div className="hero-buttons">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary"
                >
                  My Workflows
                </button>
                <button
                  onClick={() => navigate("/builder")}
                  className="btn-secondary"
                >
                  Open Visual Builder
                </button>
              </div>
            </div>
          </Col>

          <Col lg={6}>
            <div className="hero-preview">
              <div className="preview-placeholder">
                <div className="placeholder-node node-start">
                  <span>🟢 Start</span>
                </div>
                <div className="placeholder-arrow">→</div>
                <div className="placeholder-node node-ai">
                  <span>🤖 AI Node</span>
                  <small>llama3.2</small>
                </div>
                <div className="placeholder-arrow">→</div>
                <div className="placeholder-node node-output">
                  <span>📤 Output</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
