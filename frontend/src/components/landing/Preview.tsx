import { Container, Row, Col } from "react-bootstrap";

export default function Preview() {
  return (
    <section className="preview-section">
      <Container>
        <Row>
          <Col>
            <h2 className="section-title">How It Works</h2>
          </Col>
        </Row>

        <Row>
          <Col>
            <div className="preview-showcase">
              <div className="showcase-workflow">
                <div className="workflow-step">
                  <div className="step-node step-start">
                    <span className="step-icon">🟢</span>
                    <span className="step-label">Start Node</span>
                  </div>
                  <p className="step-description">Trigger workflow execution</p>
                </div>

                <div className="workflow-connector">→</div>

                <div className="workflow-step">
                  <div className="step-node step-ai">
                    <span className="step-icon">🤖</span>
                    <span className="step-label">AI Node</span>
                    <span className="step-status status-executing">
                      ⏳ Executing...
                    </span>
                  </div>
                  <p className="step-description">Process with local LLM</p>
                </div>

                <div className="workflow-connector">→</div>

                <div className="workflow-step">
                  <div className="step-node step-output">
                    <span className="step-icon">📤</span>
                    <span className="step-label">Output Node</span>
                    <span className="step-status status-completed">
                      ✅ Completed
                    </span>
                  </div>
                  <p className="step-description">Display final result</p>
                </div>
              </div>

              <div className="showcase-info">
                <div className="info-badge">
                  <span className="badge-icon">⚡</span>
                  <span>Real-time execution tracking</span>
                </div>
                <div className="info-badge">
                  <span className="badge-icon">🔗</span>
                  <span>Visual graph-based flow</span>
                </div>
                <div className="info-badge">
                  <span className="badge-icon">🎯</span>
                  <span>Node-level status updates</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
