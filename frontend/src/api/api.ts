import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  workflow?: string;
  nodeCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export async function getWorkflows(): Promise<Workflow[]> {
  const response = await axios.get(`${API_BASE_URL}/workflows`);
  return response.data;
}

export async function createWorkflow(data: {
  name: string;
  workflow: string;
  description?: string;
}) {
  return axios.post(`${API_BASE_URL}/workflows`, data);
}

export async function deleteWorkflow(id: number) {
  return axios.delete(`${API_BASE_URL}/workflows/${id}`);
}

export async function updateWorkflow(
  id: number,
  data: { Name: string; Workflow: string }
) {
  return axios.put(`${API_BASE_URL}/workflows/${id}`, data);
}

export async function saveDiagram(
  id: number,
  diagram: { nodes: any[]; edges: any[] }
) {
  return axios.put(`${API_BASE_URL}/workflows/${id}/diagram`, diagram);
}

export async function getDiagram(id: number) {
  return axios.get(`${API_BASE_URL}/workflows/${id}/diagram`);
}

export async function executeWorkflow(data: {
  prompt: string;
  model: string;
  temperature?: number;
}) {
  return axios.post(`${API_BASE_URL}/executeWorkflow`, data);
}
