/**
 * API Client
 *
 * Purpose:
 * - Centralize HTTP calls to the backend workflow service.
 *
 * Role in the system:
 * - Acts as the typed boundary between frontend features and server endpoints.
 *
 * Key responsibilities:
 * - Define request/response shapes for workflow operations.
 * - Enforce a single base URL for all requests.
 *
 * Important constraints and assumptions:
 * - VITE_API_BASE_URL must be defined at build time.
 * - Axios is used for all HTTP interactions to keep behavior consistent.
 */

import axios from "axios";

// ================================
// Configuration
// ================================
// Read the API base URL from the Vite environment variables.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

// ================================
// Types
// ================================
export interface Workflow {
  id: number;
  name: string;
  description?: string;
  workflow?: string;
  nodeCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// ================================
// Workflow Endpoints
// ================================
/**
 * Fetch all workflows for the current user context.
 */
export async function getWorkflows(): Promise<Workflow[]> {
  const response = await axios.get(`${API_BASE_URL}/workflows`);
  return response.data;
}

/**
 * Create a new workflow with serialized diagram data.
 */
export async function createWorkflow(data: {
  name: string;
  workflow: string;
  description?: string;
}) {
  return axios.post(`${API_BASE_URL}/workflows`, data);
}

/**
 * Delete a workflow by id.
 */
export async function deleteWorkflow(id: number) {
  return axios.delete(`${API_BASE_URL}/workflows/${id}`);
}

/**
 * Update workflow metadata and optional workflow content.
 */
export async function updateWorkflow(
  id: number,
  data: { name: string; description?: string; workflow?: string }
) {
  return axios.put(`${API_BASE_URL}/workflows/${id}`, data);
}

/**
 * Persist the diagram structure for a workflow.
 */
export async function saveDiagram(
  id: number,
  diagram: { nodes: any[]; edges: any[] }
) {
  return axios.put(`${API_BASE_URL}/workflows/${id}/diagram`, diagram);
}

/**
 * Retrieve the diagram structure for a workflow.
 */
export async function getDiagram(id: number) {
  return axios.get(`${API_BASE_URL}/workflows/${id}/diagram`);
}

/**
 * Execute a workflow with model parameters and a prompt.
 */
export async function executeWorkflow(data: {
  prompt: string;
  model: string;
  temperature?: number;
}) {
  return axios.post(`${API_BASE_URL}/executeWorkflow`, data);
}
