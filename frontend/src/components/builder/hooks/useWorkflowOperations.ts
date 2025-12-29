import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SiteSchema, PageSchema } from "../../../types/siteSchema";
import { saveDiagram, executeWorkflow } from "../../../api/api";
import { buildTree } from "../../../utils/buildTree";
import { exportHTML } from "../../../utils/exportHtml";

const MODE: "workflow" | "builder" = "builder";

export function useWorkflowOperations(
  id: string | null,
  site: SiteSchema,
  activePage: PageSchema,
  setNodes?: (nodesOrUpdater: any) => void
) {
  const navigate = useNavigate();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");

  const nodes = activePage.nodes;
  const edges = activePage.edges;

  const save = async () => {
    if (!id) {
      setWorkflowName("");
      setWorkflowDescription("");
      setShowSaveDialog(true);
      return;
    }
    await saveDiagram(Number(id), site as any);
    alert("Site saved successfully!");
  };

  const handleSaveConfirm = async () => {
    const name =
      workflowName.trim() || `Workflow ${new Date().toLocaleString()}`;
    const description = workflowDescription.trim();

    try {
      const { createWorkflow, saveDiagram } = await import("../../../api/api");
      const response = await createWorkflow({
        name,
        description,
        workflow: JSON.stringify(site),
      });

      const workflowId = response.data.id;
      if (!workflowId) {
        alert("Failed to create site - no ID returned");
        return;
      }

      await saveDiagram(workflowId, site as any);
      setShowSaveDialog(false);
      navigate(`/pageBuilder?id=${workflowId}`, { replace: true });
      alert("Site created and saved successfully!");
    } catch (error) {
      console.error("Failed to create site:", error);
      alert("Failed to create site");
    }
  };

  const runWorkflow = async () => {
    if (MODE === "builder") {
      alert(
        "Execution is disabled in Builder mode. Switch to Workflow mode to run AI workflows."
      );
      return;
    }

    if (isExecuting || !setNodes) return;

    try {
      setIsExecuting(true);

      const startNode = nodes.find(
        (n: any) =>
          n.type === "start" || n.data?.label?.toLowerCase().includes("start")
      );
      if (!startNode) {
        alert(
          "Error: No Start node found. Add a Start node using the '➕ Add Start Node' button."
        );
        return;
      }

      const connectedEdge = edges.find((e: any) => e.source === startNode.id);
      if (!connectedEdge) {
        alert("Error: Start node not connected to AI node");
        return;
      }

      const aiNode = nodes.find(
        (n: any) => n.id === connectedEdge.target && n.type === "ai"
      );
      if (!aiNode) {
        alert("Error: Start node must connect to AI node");
        return;
      }

      if (!aiNode.data.prompt || !aiNode.data.model) {
        alert("Error: AI node must have both prompt and model set");
        return;
      }

      setNodes((nds: any) =>
        nds.map((n: any) =>
          n.id === aiNode.id
            ? { ...n, data: { ...n.data, status: "executing", output: null } }
            : n
        )
      );

      const response = await executeWorkflow({
        prompt: aiNode.data.prompt,
        model: aiNode.data.model,
        temperature: aiNode.data.temperature ?? 0.7,
      });

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

  const handleExportHTML = () => {
    site.pages.forEach((page) => {
      const tree = buildTree(page.nodes, page.edges);
      const html = exportHTML(tree, page.nodes as any);

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${page.name.toLowerCase().replace(/\s+/g, "-")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    alert(`Exported ${site.pages.length} page(s)!`);
  };

  return {
    isExecuting,
    save,
    runWorkflow,
    handleExportHTML,
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
