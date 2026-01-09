/**
 * Home Page (Legacy)
 *
 * Purpose:
 * - Provide a basic workflow list and creation UI.
 *
 * Role in the system:
 * - Serves as a simple landing for workflow CRUD actions.
 *
 * Key responsibilities:
 * - Load workflows on mount and pass them to child components.
 * - Provide navigation to the visual builder.
 *
 * Important constraints and assumptions:
 * - API calls are performed on mount without pagination.
 * - Errors are logged to console for visibility during development.
 */

import { useState, useEffect } from "react";
import { getWorkflows, type Workflow } from "../api/api";
import { useNavigate } from "react-router-dom";
import WorkflowForm from "../components/WorkflowForm";
import WorkflowList from "../components/WorkflowList";

// ================================
// Component
// ================================
/**
 * Basic workflow management page.
 */
function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const navigate = useNavigate();

  // ================================
  // Data Loading
  // ================================
  useEffect(() => {
    // Fetch workflows once on mount; errors are logged for debugging.
    getWorkflows()
      .then((workflows) => setWorkflows(workflows))
      .catch((err) => console.error("Error loading workflows", err));
  }, []);

  // ================================
  // Render
  // ================================
  return (
    <div>
      <WorkflowForm setWorkflows={setWorkflows} />
      <WorkflowList workflows={workflows} setWorkflows={setWorkflows} />
      {/* Navigation to the builder is explicit to avoid accidental context changes. */}
      <button onClick={() => navigate("/pageBuilder")}>
        Go to Visual Builder
      </button>
    </div>
  );
}

export default Home;
