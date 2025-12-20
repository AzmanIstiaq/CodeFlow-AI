export default function Features() {
  const features = [
    {
      icon: "🔄",
      title: "Graph-Driven Execution",
      description: "Execution follows the workflow graph, not button logic.",
    },
    {
      icon: "🏠",
      title: "Local-First AI",
      description: "Run workflows locally using Ollama. No API keys required.",
    },
    {
      icon: "🧩",
      title: "Extensible by Design",
      description: "Easily add new nodes, models, and providers.",
    },
  ];

  return (
    <section className="features-section">
      <div className="features-container">
        <h2 className="section-title">Why CodeFlow AI</h2>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
