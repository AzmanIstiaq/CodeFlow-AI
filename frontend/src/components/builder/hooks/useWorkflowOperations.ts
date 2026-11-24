/**
 * useWorkflowOperations Hook
 *
 * Manages workflow persistence and execution operations.
 * Handles saving new workflows, updating existing ones, and running AI workflows.
 *
 * Key Operations:
 * 1. Save: Persists workflow to server (creates new or updates existing)
 * 2. Run Workflow: Executes AI workflow by chaining start → AI → output nodes
 *
 * Dialog Management:
 * - Show save dialog for new workflows (prompts for name/description)
 * - Reuse URL id for existing workflows (silent save)
 *
 * Note: This hook has MODE switch between "workflow" and "builder"
 * Currently set to "builder" - AI execution disabled
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SiteSchema, PageSchema } from "../../../types/siteSchema";
import { createWorkflow, saveDiagram, executeWorkflow } from "../../../api/api";
import { serializeSite } from "../../../utils/sitePersistence";

const MODE: "workflow" | "builder" = "builder";

export function useWorkflowOperations(
  id: string | null,
  site: SiteSchema,
  activePage: PageSchema,
  setNodes?: (nodesOrUpdater: any) => void
) {
  // =====================================
  // NAVIGATION & STATE
  // =====================================
  const navigate = useNavigate();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");

  // Convenience getters for current page's nodes and edges
  const nodes = activePage.nodes;
  const edges = activePage.edges;

  // =====================================
  // SAVE OPERATION
  // =====================================
  /**
   * Save workflow to server
   *
   * For existing workflow (id provided):
   * - Silently update via API
   * - Show success message
   *
   * For new workflow (no id):
   * - Show dialog prompting for name and description
   * - createWorkflow() will generate new id
   */
  const save = async () => {
    if (!id) {
      // New workflow: show dialog
      setWorkflowName("");
      setWorkflowDescription("");
      setShowSaveDialog(true);
      return;
    }
    // Existing workflow: silent update
    await saveDiagram(Number(id), site as any);
    alert("Site saved successfully!");
  };

  /**
   * Handle save dialog confirmation
   *
   * Flow:
   * 1. Get name (or use timestamp as fallback)
   * 2. Call createWorkflow API to get new id
   * 3. Call saveDiagram to persist site structure
   * 4. Navigate to new workflow URL
   * 5. Close dialog
   */
  const handleSaveConfirm = async () => {
    const name =
      workflowName.trim() || `Workflow ${new Date().toLocaleString()}`;
    const description = workflowDescription.trim();

    try {
      const response = await createWorkflow({
        name,
        description,
        workflow: serializeSite(site),
      });

      const workflowId = response.data.id;
      if (!workflowId) {
        alert("Failed to create site - no ID returned");
        return;
      }

      // Save the full site structure
      await saveDiagram(workflowId, site as any);
      setShowSaveDialog(false);

      // Navigate to the new workflow
      navigate(`/pageBuilder?id=${workflowId}`, { replace: true });
      alert("Site created and saved successfully!");
    } catch (error) {
      console.error("Failed to create site:", error);
      alert("Failed to create site");
    }
  };

  // =====================================
  // WORKFLOW EXECUTION (AI MODE ONLY)
  // =====================================
  /**
   * Execute AI workflow
   *
   * Disabled in builder mode. In workflow mode:
   * 1. Validate start node exists and is connected
   * 2. Find connected AI node
   * 3. Call AI API with prompt and model from AI node
   * 4. Update AI node status and output
   * 5. Propagate output to connected output node
   *
   * Error handling:
   * - No start node: prompt user to add one
   * - No AI node: prompt user to connect to AI
   * - Missing prompt/model: prompt user to configure AI
   * - API errors: show error message
   */
  const runWorkflow = async () => {
    // Disable in builder mode
    if (MODE === "builder") {
      alert(
        "Execution is disabled in Builder mode. Switch to Workflow mode to run AI workflows."
      );
      return;
    }

    if (isExecuting || !setNodes) return;

    try {
      setIsExecuting(true);

      // =====================================
      // VALIDATION: Find start node
      // =====================================
      const startNode = nodes.find(
        (n: any) =>
          n.type === "start" || n.data?.label?.toLowerCase().includes("start")
      );
      if (!startNode) {
        alert(
          "Error: No Start node found. Add a Start node using the 'Add Start Node' button."
        );
        return;
      }

      // =====================================
      // VALIDATION: Start node connected
      // =====================================
      const connectedEdge = edges.find((e: any) => e.source === startNode.id);
      if (!connectedEdge) {
        alert("Error: Start node not connected to AI node");
        return;
      }

      // =====================================
      // VALIDATION: Find AI node
      // =====================================
      const aiNode = nodes.find(
        (n: any) => n.id === connectedEdge.target && n.type === "ai"
      );
      if (!aiNode) {
        alert("Error: Start node must connect to AI node");
        return;
      }

      // =====================================
      // VALIDATION: AI node configured
      // =====================================
      if (!aiNode.data.prompt || !aiNode.data.model) {
        alert("Error: AI node must have both prompt and model set");
        return;
      }

      // =====================================
      // SET EXECUTING STATE
      // =====================================
      setNodes((nds: any) =>
        nds.map((n: any) =>
          n.id === aiNode.id
            ? { ...n, data: { ...n.data, status: "executing", output: null } }
            : n
        )
      );

      // =====================================
      // CALL AI API
      // =====================================
      const response = await executeWorkflow({
        prompt: aiNode.data.prompt,
        model: aiNode.data.model,
        temperature: aiNode.data.temperature ?? 0.7,
      });

      // =====================================
      // UPDATE AI NODE WITH OUTPUT
      // =====================================
      setNodes((nds: any) =>
        nds.map((n: any) =>
          n.id === aiNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  status: "completed",
                  output: response.data.output,
                },
              }
            : n
        )
      );

      // =====================================
      // PROPAGATE OUTPUT TO OUTPUT NODE
      // =====================================
      const outputEdge = edges.find((e: any) => e.source === aiNode.id);
      if (outputEdge) {
        const outputNode = nodes.find(
          (n: any) => n.id === outputEdge.target && n.type === "output"
        );
        if (outputNode) {
          setNodes((nds: any) =>
            nds.map((n: any) =>
              n.id === outputNode.id
                ? { ...n, data: { ...n.data, result: response.data.output } }
                : n
            )
          );
        }
      }

      alert("Workflow executed successfully!");
    } catch (error: any) {
      // Update AI node to show failure
      const aiNode = nodes.find((n: any) => n.type === "ai");
      if (aiNode && setNodes) {
        setNodes((nds: any) =>
          nds.map((n: any) =>
            n.id === aiNode.id
              ? { ...n, data: { ...n.data, status: "failed" } }
              : n
          )
        );
      }

      alert(
        "Error: " +
          (error.response?.data?.error ||
            error.message ||
            "Failed to execute workflow")
      );
    } finally {
      setIsExecuting(false);
    }
  };

  // =====================================
  // HOOK EXPORTS
  // =====================================
  return {
    isExecuting,
    save,
    runWorkflow,
    dialogProps: {
      isOpen: showSaveDialog,
      workflowName,
      workflowDescription,
      onClose: () => setShowSaveDialog(false),
      onSave: handleSaveConfirm,
      onNameChange: setWorkflowName,
      onDescriptionChange: setWorkflowDescription,
    },
  };
}
