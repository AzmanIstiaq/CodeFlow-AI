import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  type Workflow,
} from "../api/api";
import BackButton from "../components/BackButton";
import { Container, Row, Col, Card } from "react-bootstrap";

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
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
      setWorkflows(data || []);
    } catch (error: any) {
      console.error("Failed to load workflows:", error);
      setWorkflows([]);
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
    } catch (error: any) {
      console.error("Failed to create workflow:", error);
      // Show more detailed error information
      const errorMessage =
        error?.response?.data?.message || error?.message || "Unknown error";
      alert(`Failed to create workflow: ${errorMessage}`);
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
    } catch (error: any) {
      console.error("Failed to delete workflow:", error);
      alert("Failed to delete workflow");
    }
  };

  const handleEditWorkflow = (e: React.MouseEvent, workflow: Workflow) => {
    e.stopPropagation(); // Prevent opening the workflow
    setEditingWorkflow(workflow);
    setEditName(workflow.name);
    setEditDescription(workflow.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingWorkflow) return;

    try {
      await updateWorkflow(editingWorkflow.id, {
        name: editName,
        description: editDescription,
        workflow: editingWorkflow.workflow,
      });
      setEditingWorkflow(null);
      await loadWorkflows();
    } catch (error: any) {
      console.error("Failed to update workflow:", error);
      alert("Failed to update workflow");
    }
  };

  return (
    <Container fluid className="dashboard-page" style={{ minHeight: "100vh" }}>
      {editingWorkflow && (
        <div className="modal-overlay" onClick={() => setEditingWorkflow(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Workflow</h2>
            <input
              type="text"
              placeholder="Enter workflow name..."
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              className="workflow-name-input"
            />
            <textarea
              placeholder="Enter workflow description (optional)..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="workflow-description-input"
              rows={3}
            />
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setEditingWorkflow(null)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
            <BackButton />
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
          <Row className="workflows-grid">
            {workflows.map((workflow) => (
              <Col key={workflow.id} lg={4} md={6} sm={12}>
                <Card
                  className="workflow-card"
                  onClick={() => handleOpenWorkflow(workflow.id)}
                >
                  <Card.Body>
                    <div className="workflow-card-header">
                      <Card.Title as="h3">{workflow.name}</Card.Title>
                      <span className="workflow-badge">
                        {(() => {
                          try {
                            return workflow.workflow
                              ? JSON.parse(workflow.workflow).nodes?.length || 0
                              : 0;
                          } catch {
                            return 0;
                          }
                        })()}{" "}
                        nodes
                      </span>
                    </div>
                    <Card.Text className="workflow-description">
                      {workflow.description || "No description"}
                    </Card.Text>
                    <div className="workflow-card-footer">
                      <span className="workflow-date">
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn-delete"
                          onClick={(e) => handleEditWorkflow(e, workflow)}
                          title="Edit workflow"
                          style={{
                            background: "transparent",
                            border: "1px solid #3b82f6",
                            color: "#3b82f6",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={(e) => handleDeleteWorkflow(e, workflow.id)}
                          title="Delete workflow"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </Container>
  );
}
