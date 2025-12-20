import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkflows, createWorkflow, type Workflow } from "../api/api";

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflows();
  }, []);

  // Reload workflows when the page gains focus (user returns from builder)
  useEffect(() => {
    const handleFocus = () => {
      loadWorkflows();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await getWorkflows();
      console.log("Loaded workflows:", data);
      setWorkflows(data);
    } catch (error) {
      console.error("Failed to load workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setNewWorkflowName("");
    setNewWorkflowDescription("");
    setShowCreateDialog(true);
  };

  const handleCreateConfirm = async () => {
    const name =
      newWorkflowName.trim() || `Workflow ${new Date().toLocaleString()}`;
    const description = newWorkflowDescription.trim();

    try {
      const response = await createWorkflow({
        name: name,
        description: description,
        workflow: JSON.stringify({ nodes: [], edges: [] }),
      });

      // Backend returns { id, message }
      const workflowId = response.data.id;

      if (workflowId) {
        setShowCreateDialog(false);
        navigate(`/builder?id=${workflowId}`);
      } else {
        console.error("No workflow ID in response:", response.data);
        alert("Failed to create workflow - no ID returned");
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
      alert("Failed to create workflow");
    }
  };

  const handleOpenWorkflow = (id: number) => {
    navigate(`/builder?id=${id}`);
  };

  const handleDeleteWorkflow = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent opening the workflow
    if (!confirm("Are you sure you want to delete this workflow?")) {
      return;
    }

    try {
      const { deleteWorkflow } = await import("../api/api");
      await deleteWorkflow(id);
      // Reload workflows after deletion
      await loadWorkflows();
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      alert("Failed to delete workflow");
    }
  };

  return (
    <div className="dashboard-page">
      {showCreateDialog && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateDialog(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Workflow</h2>
            <input
              type="text"
              placeholder="Enter workflow name..."
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              autoFocus
              className="workflow-name-input"
            />
            <textarea
              placeholder="Enter workflow description (optional)..."
              value={newWorkflowDescription}
              onChange={(e) => setNewWorkflowDescription(e.target.value)}
              className="workflow-description-input"
              rows={3}
            />
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateConfirm}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>My Workflows</h1>
            <p className="dashboard-subtitle">
              Manage your AI workflow projects
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreateNew}>
            + Create New Workflow
          </button>
        </header>

        {loading ? (
          <div className="dashboard-loading">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="dashboard-empty">
            <div className="empty-icon">📋</div>
            <h3>No workflows yet</h3>
            <p>Create your first AI workflow to get started</p>
            <button className="btn-primary" onClick={handleCreateNew}>
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="workflows-grid">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="workflow-card"
                onClick={() => handleOpenWorkflow(workflow.id)}
              >
                <div className="workflow-card-header">
                  <h3>{workflow.name}</h3>
                  <span className="workflow-badge">
                    {workflow.workflow
                      ? JSON.parse(workflow.workflow).nodes?.length || 0
                      : 0}{" "}
                    nodes
                  </span>
                </div>
                <p className="workflow-description">
                  {workflow.description || "No description"}
                </p>
                <div className="workflow-card-footer">
                  <span className="workflow-date">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    className="btn-delete"
                    onClick={(e) => handleDeleteWorkflow(e, workflow.id)}
                    title="Delete workflow"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
