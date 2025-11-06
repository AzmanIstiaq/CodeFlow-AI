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