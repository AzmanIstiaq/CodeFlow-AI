import { useState, useEffect } from "react";
import { getWorkflows } from "../api/api";
import { useNavigate } from "react-router-dom";
import WorkflowForm from "../components/WorkflowForm";
import WorkflowList from "../components/WorkflowList";

interface Workflow {
  id: number;
  name: string;
  workflow: string;
}



function Home() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        getWorkflows()
        .then((res) => setWorkflows(res.data))
        .catch((err) => console.error("Error loading workflows", err));
    }, []);

    return (
        <div>
        <WorkflowForm setWorkflows={setWorkflows} />
        <WorkflowList workflows={workflows} setWorkflows={setWorkflows} />
        <button onClick={() => navigate("/builder")}>Go to Visual Builder</button>
        </div>
    );
}

export default Home;
