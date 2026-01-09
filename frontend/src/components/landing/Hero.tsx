/**
 * Hero Section
 *
 * Purpose:
 * - Present the primary marketing headline and key calls to action.
 *
 * Role in the system:
 * - Anchors the landing page narrative and directs users to core flows.
 *
 * Key responsibilities:
 * - Render headline copy, supporting text, and navigation buttons.
 * - Provide a lightweight visual preview of the workflow concept.
 *
 * Important constraints and assumptions:
 * - Buttons navigate to dashboard and builder routes.
 * - Preview content is static and illustrative only.
 */

import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { ArrowRight, Bot, Play, Terminal } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Landing hero with calls to action and a visual preview.
 */
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
                  onClick={() => navigate("/pageBuilder")}
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
                  <span>
                    <Play size={16} aria-hidden="true" /> Start
                  </span>
                </div>
                <div className="placeholder-arrow">
                  <ArrowRight size={16} aria-hidden="true" />
                </div>
                <div className="placeholder-node node-ai">
                  <span>
                    <Bot size={16} aria-hidden="true" /> AI Node
                  </span>
                  <small>llama3.2</small>
                </div>
                <div className="placeholder-arrow">
                  <ArrowRight size={16} aria-hidden="true" />
                </div>
                <div className="placeholder-node node-output">
                  <span>
                    <Terminal size={16} aria-hidden="true" /> Output
                  </span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
