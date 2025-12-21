import { useState, useEffect } from "react";
import { getWorkflows, type Workflow } from "../api/api";
import { useNavigate } from "react-router-dom";
import WorkflowForm from "../components/WorkflowForm";
import WorkflowList from "../components/WorkflowList";

function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getWorkflows()
      .then((workflows) => setWorkflows(workflows))
      .catch((err) => console.error("Error loading workflows", err));
  }, []);

  return (
    <div>
      <WorkflowForm setWorkflows={setWorkflows} />
      <WorkflowList workflows={workflows} setWorkflows={setWorkflows} />
      <button onClick={() => navigate("/pageBuilder")}>
        Go to Visual Builder
      </button>
    </div>
  );
}

export default Home;
