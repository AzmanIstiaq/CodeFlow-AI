import { useState } from "react";
import {
  deleteWorkflow,
  updateWorkflow,
  getWorkflows,
  type Workflow,
} from "../api/api";
import { useNavigate } from "react-router-dom";

interface WorkflowListProps {
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
}

function WorkflowList({ workflows, setWorkflows }: WorkflowListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingWorkflow, setEditingWorkflow] = useState("");
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    try {
      await deleteWorkflow(id);
      const workflows = await getWorkflows();
      setWorkflows(workflows);
    } catch (err) {
      console.error("Error deleting workflow", err);
    }
  };

  const handleUpdate = async (
    id: number,
    updatedData: { Name: string; Workflow: string }
  ) => {
    try {
      await updateWorkflow(id, updatedData);
      const workflows = await getWorkflows();
      setWorkflows(workflows);
    } catch (err) {
      console.error("Error updating workflow", err);
    }
  };

  if (!workflows) return <p>Loading...</p>;
  if (workflows.length === 0) return <p>No workflows yet</p>;

  return (
    <ul>
      {workflows.map((w) => (
        <li key={w.id}>
          {editingId === w.id ? (
            <>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
              />
              <textarea
                value={editingWorkflow}
                onChange={(e) => setEditingWorkflow(e.target.value)}
              />
              <button
                onClick={() => {
                  handleUpdate(w.id, {
                    Name: editingName,
                    Workflow: editingWorkflow,
                  });
                  setEditingId(null);
                }}
              >
                Save
              </button>
              <button onClick={() => setEditingId(null)}>Cancel</button>
            </>
          ) : (
            <>
              {w.name}: {w.workflow}{" "}
              <button
                onClick={() => {
                  setEditingId(w.id);
                  setEditingName(w.name);
                  setEditingWorkflow(w.workflow || "");
                }}
              >
                Edit
              </button>{" "}
              <button onClick={() => handleDelete(w.id)}>Delete</button>{" "}
              <button onClick={() => navigate(`/builder?id=${w.id}`)}>
                Open
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default WorkflowList;
