/**
 * Features Section
 *
 * Purpose:
 * - Highlight key product capabilities in a compact grid.
 *
 * Role in the system:
 * - Reinforces product value propositions on the landing page.
 *
 * Key responsibilities:
 * - Define static feature metadata and render feature cards.
 *
 * Important constraints and assumptions:
 * - Feature content is static and intended for marketing copy.
 */

import { Container, Row, Col, Card } from "react-bootstrap";
import { Cpu, GitBranch, Puzzle } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Render marketing feature cards.
 */
export default function Features() {
  const features = [
    {
      icon: <GitBranch size={22} aria-hidden="true" />,
      title: "Graph-Driven Execution",
      description: "Execution follows the workflow graph, not button logic.",
    },
    {
      icon: <Cpu size={22} aria-hidden="true" />,
      title: "Local-First AI",
      description: "Run workflows locally using Ollama. No API keys required.",
    },
    {
      icon: <Puzzle size={22} aria-hidden="true" />,
      title: "Extensible by Design",
      description: "Easily add new nodes, models, and providers.",
    },
  ];

  return (
    <section className="features-section">
      <Container className="features-container">
        <Row>
          <Col>
            <h2 className="section-title">Why CodeFlow AI</h2>
          </Col>
        </Row>
        <Row>
          {features.map((feature, index) => (
            <Col key={index} lg={4} md={6} sm={12}>
              <Card className="feature-card">
                <Card.Body>
                  <div className="feature-icon">{feature.icon}</div>
                  <Card.Title as="h3" className="feature-title">
                    {feature.title}
                  </Card.Title>
                  <Card.Text className="feature-description">
                    {feature.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
