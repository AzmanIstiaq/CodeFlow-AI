import axios from "axios";

const API_BASE_URL = "http://localhost:5146/api";

export async function getWorkflows() {
    return axios.get(`${API_BASE_URL}/workflows`);
}

export async function createWorkflow(data: { Name: string; Workflow: string}) {
    return axios.post(`${API_BASE_URL}/workflows`, data);
}

export async function deleteWorkflow(id: number) {
    return axios.delete(`${API_BASE_URL}/workflows/${id}`);
}

export async function updateWorkflow(id: number, data: { Name: string; Workflow: string}) {
    return axios.put(`${API_BASE_URL}/workflows/${id}`, data);
}

export async function saveDiagram(id: number, diagram: { nodes: any[]; edges: any[] }) {
    return axios.put(`${API_BASE_URL}/workflows/${id}/diagram`, diagram);
}

export async function getDiagram(id: number) {
    return axios.get(`${API_BASE_URL}/workflows/${id}/diagram`);
}

