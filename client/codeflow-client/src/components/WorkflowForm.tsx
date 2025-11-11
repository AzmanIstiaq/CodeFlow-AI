import { useState } from "react";
import { createWorkflow, getWorkflows } from "../api/api";

interface WorkflowFormProps {
  setWorkflows: React.Dispatch<React.SetStateAction<any[]>>;
}

function WorkflowForm({ setWorkflows }: WorkflowFormProps) {
  const [name, setName] = useState("");
  const [workflow, setWorkflow] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !workflow) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await createWorkflow({ Name: name, Workflow: workflow });
      const res = await getWorkflows();
      setWorkflows(res.data);
      setName("");
      setWorkflow("");
    } catch (err) {
      console.error("Error creating workflow", err);
    }
  };

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
