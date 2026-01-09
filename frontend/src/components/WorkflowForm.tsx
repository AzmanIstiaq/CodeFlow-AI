/**
 * Workflow Form
 *
 * Purpose:
 * - Provide a minimal form to create a new workflow.
 *
 * Role in the system:
 * - Used in the legacy home page to submit workflow data.
 *
 * Key responsibilities:
 * - Collect name and serialized workflow content.
 * - Trigger API creation and refresh the list on success.
 *
 * Important constraints and assumptions:
 * - Both fields are required before submission.
 * - Errors are logged rather than surfaced to the UI.
 */

import { useState } from "react";
import { createWorkflow, getWorkflows } from "../api/api";

// ================================
// Types
// ================================
interface WorkflowFormProps {
  setWorkflows: React.Dispatch<React.SetStateAction<any[]>>;
}

// ================================
// Component
// ================================
/**
 * Form for creating workflows via the API.
 */
function WorkflowForm({ setWorkflows }: WorkflowFormProps) {
  const [name, setName] = useState("");
  const [workflow, setWorkflow] = useState("");

  // ================================
  // Handlers
  // ================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against empty submissions to avoid invalid API calls.
    if (!name || !workflow) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await createWorkflow({ name: name, workflow: workflow });
      // Refresh the list to reflect the newly created workflow.
      const workflows = await getWorkflows();
      setWorkflows(workflows);
      setName("");
      setWorkflow("");
    } catch (err) {
      console.error("Error creating workflow", err);
    }
  };

  // ================================
  // Render
  // ================================
  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Workflow</h2>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Workflow:
          <textarea
            value={workflow}
            onChange={(e) => setWorkflow(e.target.value)}
          />
        </label>
      </div>
      <button type="submit">Create</button>
    </form>
  );
}

export default WorkflowForm;
