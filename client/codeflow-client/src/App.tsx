import { useState, useEffect } from 'react'
import './App.css'
import { getWorkflows, createWorkflow, deleteWorkflow, updateWorkflow } from './api'

interface Workflow {
  id: number;
  name: string;
  workflow: string;
}

function App() {
  const [getWorkflowsData, setGetWorkflowsData] = useState<Workflow[]>([]);

  useEffect(() => {
    getWorkflows()
      .then(res => setGetWorkflowsData(res.data))
      .catch(err => console.error("Error loading workflows", err));
  }, []);

  const [name, setName] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingWorkflow, setEditingWorkflow] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !workflow) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await createWorkflow({ Name: name, Workflow: workflow });
      const res = await getWorkflows();
      setGetWorkflowsData(res.data);
      setName('');
      setWorkflow('');
    } catch (err) {
      console.error("Error creating workflow", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWorkflow(id);
      const res = await getWorkflows();
      setGetWorkflowsData(res.data);
    } catch (err) {
      console.error("Error deleting workflow", err);
    }

  };

  const handleUpdate = async (id: number, updatedData: { Name: string; Workflow: string}) => {
    try {
      await updateWorkflow(id, updatedData);
      const res = await getWorkflows();
      setGetWorkflowsData(res.data);
    } catch (err) {
      console.error("Error updating workflow", err);
    }
  };

  return (
    <>
      <div>
        <form onSubmit={handleSubmit}>
          <h2>Create Workflow</h2>
          <div>
            <label>
              Name:
              <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)}/>
            </label>
          </div>
          <div>
            <label>
              Workflow:
              <textarea name="workflow" value={workflow} onChange={(e) => setWorkflow(e.target.value)}/>
            </label>
          </div>
          <button type="submit">Create</button>
        </form>
        {!getWorkflowsData && <p>Loading...</p>}
        {getWorkflowsData && getWorkflowsData.length === 0 && <p>No workflows yet</p>}
        {getWorkflowsData && getWorkflowsData.length > 0 && (
          <ul>
            {getWorkflowsData.map((w: any) => (
              <li key={w.id}>
                {editingId === w.id ? (
                  <>
                    <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    <textarea value={editingWorkflow} onChange={(e) => setEditingWorkflow(e.target.value)} />
                    <button onClick={() => {
                      handleUpdate(w.id, { Name: editingName, Workflow: editingWorkflow });
                      setEditingId(null);
                    }}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    {w.name}: {w.workflow} 
                    <button onClick={() => {
                      setEditingId(w.id);
                      setEditingName(w.name);
                      setEditingWorkflow(w.workflow);
                    }}>Edit</button>
                  </>
                )}
                <button onClick={() => handleDelete(w.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default App
