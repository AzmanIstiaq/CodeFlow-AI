import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-headline">Build AI workflows visually.</h1>
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
      </div>
    </section>
  );
}
