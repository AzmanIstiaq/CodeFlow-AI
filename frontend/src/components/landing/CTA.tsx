import { useNavigate } from "react-router-dom";

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div className="cta-container">
        <h2 className="cta-headline">Start building AI workflows now.</h2>
        <button
          onClick={() => navigate("/builder")}
          className="btn-primary btn-large"
        >
          Launch Builder →
        </button>
      </div>
    </section>
  );
}
