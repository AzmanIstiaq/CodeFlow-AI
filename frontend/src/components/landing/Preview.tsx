/**
 * Preview Section
 *
 * Purpose:
 * - Illustrate the product workflow at a glance.
 *
 * Role in the system:
 * - Provides a visual explanation of how the workflow engine operates.
 *
 * Key responsibilities:
 * - Render a step-by-step preview of node execution states.
 * - Highlight key product benefits alongside the diagram.
 *
 * Important constraints and assumptions:
 * - All content is static and illustrative; no live data is shown.
 * - Status labels are visual-only and do not reflect real execution.
 */

import { Container, Row, Col } from "react-bootstrap";
import { Activity, ArrowRight, Bot, CheckCircle, GitBranch, Layers, Loader2, Play, Terminal } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Marketing preview of workflow steps and product highlights.
 */
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
                    <span className="step-icon">
                      <Play size={16} aria-hidden="true" />
                    </span>
                    <span className="step-label">Start Node</span>
                  </div>
                  <p className="step-description">Trigger workflow execution</p>
                </div>

                <div className="workflow-connector">
                  <ArrowRight size={16} aria-hidden="true" />
                </div>

                <div className="workflow-step">
                  <div className="step-node step-ai">
                    <span className="step-icon">
                      <Bot size={16} aria-hidden="true" />
                    </span>
                    <span className="step-label">AI Node</span>
                    <span className="step-status status-executing">
                      <Loader2 size={14} aria-hidden="true" /> Executing...
                    </span>
                  </div>
                  <p className="step-description">Process with local LLM</p>
                </div>

                <div className="workflow-connector">
                  <ArrowRight size={16} aria-hidden="true" />
                </div>

                <div className="workflow-step">
                  <div className="step-node step-output">
                    <span className="step-icon">
                      <Terminal size={16} aria-hidden="true" />
                    </span>
                    <span className="step-label">Output Node</span>
                    <span className="step-status status-completed">
                      <CheckCircle size={14} aria-hidden="true" /> Completed
                    </span>
                  </div>
                  <p className="step-description">Display final result</p>
                </div>
              </div>

              <div className="showcase-info">
                <div className="info-badge">
                  <span className="badge-icon">
                    <Activity size={16} aria-hidden="true" />
                  </span>
                  <span>Real-time execution tracking</span>
                </div>
                <div className="info-badge">
                  <span className="badge-icon">
                    <GitBranch size={16} aria-hidden="true" />
                  </span>
                  <span>Visual graph-based flow</span>
                </div>
                <div className="info-badge">
                  <span className="badge-icon">
                    <Layers size={16} aria-hidden="true" />
                  </span>
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
