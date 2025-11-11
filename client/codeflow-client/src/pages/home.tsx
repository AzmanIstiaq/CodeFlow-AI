import { useState, useEffect } from "react";
import { getWorkflows } from "../api/api";
import WorkflowForm from "../components/WorkflowForm";
import WorkflowList from "../components/WorkflowList";

interface Workflow {
  id: number;
  name: string;
  workflow: string;
}

function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    getWorkflows()
      .then((res) => setWorkflows(res.data))
      .catch((err) => console.error("Error loading workflows", err));
  }, []);

  return (
    <div>
      <WorkflowForm setWorkflows={setWorkflows} />
      <WorkflowList workflows={workflows} setWorkflows={setWorkflows} />
    </div>
  );
}

export default Home;
