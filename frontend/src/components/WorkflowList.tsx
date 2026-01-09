/**
 * Workflow List
 *
 * Purpose:
 * - Display workflows and support inline edit/delete operations.
 *
 * Role in the system:
 * - Used by the legacy home page to manage workflows without the full dashboard UI.
 *
 * Key responsibilities:
 * - Render list items with edit and view states.
 * - Perform update/delete operations and refresh data.
 *
 * Important constraints and assumptions:
 * - The list is re-fetched after any mutation to stay consistent with server state.
 * - Navigation to the builder is handled here for each workflow row.
 */

import { useState } from "react";
import {
  deleteWorkflow,
  updateWorkflow,
  getWorkflows,
  type Workflow,
} from "../api/api";
import { useNavigate } from "react-router-dom";

// ================================
// Types
// ================================
interface WorkflowListProps {
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
}

// ================================
// Component
// ================================
/**
 * List of workflows with inline edit and action controls.
 */
function WorkflowList({ workflows, setWorkflows }: WorkflowListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const navigate = useNavigate();

  // ================================
  // CRUD Handlers
  // ================================
  const handleDelete = async (id: number) => {
    try {
      await deleteWorkflow(id);
      const workflows = await getWorkflows();
      setWorkflows(workflows);
    } catch (err) {
      console.error("Error deleting workflow", err);
    }
  };

  const handleUpdate = async (id: number) => {
    const workflow = workflows.find((w) => w.id === id);
    try {
      await updateWorkflow(id, {
        name: editingName,
        description: editingDescription,
        workflow: workflow?.workflow,
      });
      const workflows = await getWorkflows();
      setWorkflows(workflows);
      setEditingId(null);
    } catch (err) {
      console.error("Error updating workflow", err);
    }
  };

  const startEditing = (w: Workflow) => {
    setEditingId(w.id);
    setEditingName(w.name);
    setEditingDescription(w.description || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  // ================================
  // Render
  // ================================
  if (!workflows) return <p>Loading...</p>;
  if (workflows.length === 0) return <p>No workflows yet</p>;

  return (
    <ul>
      {workflows.map((w) => (
        <li key={w.id}>
          {editingId === w.id ? (
            <div className="workflow-edit-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Workflow name"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  placeholder="Workflow description"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button onClick={() => handleUpdate(w.id)}>Save</button>
                <button onClick={cancelEditing}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="workflow-item">
              <div className="workflow-info">
                <h3>{w.name}</h3>
                {w.description && (
                  <p className="description">{w.description}</p>
                )}
              </div>
              <div className="workflow-actions">
                <button onClick={() => startEditing(w)}>Edit</button>
                <button onClick={() => navigate(`/pageBuilder?id=${w.id}`)}>
                  Open
                </button>
                <button onClick={() => handleDelete(w.id)} className="delete">
                  Delete
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default WorkflowList;
