import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import type { Connection, Node as ReactFlowNode } from "reactflow";
import "reactflow/dist/style.css";
import NodeToolbar from "../components/builder/NodeToolbar";
import StartNode from "../components/builder/CustomNodes/StartNode";
import AINode from "../components/builder/CustomNodes/AINode";
import OutputNode from "../components/builder/CustomNodes/OutputNode";
import NodeEditorPanel from "../components/builder/NodeEditorPanel";
import { saveDiagram, getDiagram, executeWorkflow } from "../api/api";

const nodeTypes = {
  start: StartNode,
  ai: AINode,
  output: OutputNode,
};

export default function VisualBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");

  useEffect(() => {
    if (id) {
      getDiagram(Number(id))
        .then((res) => {
          // Server returns { diagram: "<json string>" }
          // axios already parses JSON, so res.data is an object. Handle both shapes.
          const raw = res.data && (res.data.diagram ?? res.data);
          if (raw) {
            const str = typeof raw === "string" ? raw : JSON.stringify(raw);
            const parsed = JSON.parse(str);
            setNodes(parsed.nodes || []);
            setEdges(parsed.edges || []);
          }
        })
        .catch(() => console.log("No saved diagram yet."));
    }
  }, [id]);

  const save = async () => {
    if (!id) {
      // Show dialog to create workflow
      setWorkflowName("");
      setWorkflowDescription("");
      setShowSaveDialog(true);
      return;
    }
    await saveDiagram(Number(id), { nodes, edges });
    alert("Diagram saved successfully!");
  };

  const handleSaveConfirm = async () => {
    const name =
      workflowName.trim() || `Workflow ${new Date().toLocaleString()}`;
    const description = workflowDescription.trim();

    try {
      const { createWorkflow, saveDiagram } = await import("../api/api");
      const response = await createWorkflow({
        name: name,
        description: description,
        workflow: JSON.stringify({ nodes, edges }),
      });

      const workflowId = response.data.id;
      if (workflowId) {
        // Save the diagram to the new workflow
        await saveDiagram(workflowId, { nodes, edges });

        setShowSaveDialog(false);
        // Update URL with new workflow ID
        navigate(`/builder?id=${workflowId}`, { replace: true });
        alert("Workflow created and saved successfully!");
      } else {
        alert("Failed to create workflow - no ID returned");
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
      alert("Failed to create workflow");
    }
  };

  const runWorkflow = async () => {
    if (isExecuting) return;

    try {
      setIsExecuting(true);

      // Find Start node (flexible - match by type or label)
      const startNode = nodes.find(
        (n) =>
          n.type === "start" || n.data?.label?.toLowerCase().includes("start")
      );
      if (!startNode) {
        alert(
          "Error: No Start node found. Add a Start node using the '➕ Add Start Node' button."
        );
        return;
      }

      // Find connected AI node via graph traversal
      const connectedEdge = edges.find((e) => e.source === startNode.id);
      if (!connectedEdge) {
        alert("Error: Start node not connected to AI node");
        return;
      }

      const aiNode = nodes.find(
        (n) => n.id === connectedEdge.target && n.type === "ai"
      );
      if (!aiNode) {
        alert("Error: Start node must connect to AI node");
        return;
      }

      // Validate AI node has prompt and model
      if (!aiNode.data.prompt || !aiNode.data.model) {
        alert("Error: AI node must have both prompt and model set");
        return;
      }

      // Mark AI node as executing
      setNodes((nds) =>
        nds.map((n) =>
          n.id === aiNode.id
            ? { ...n, data: { ...n.data, status: "executing", output: null } }
            : n
        )
      );

      // Execute workflow via clean contract
      const response = await executeWorkflow({
        prompt: aiNode.data.prompt,
        model: aiNode.data.model,
        temperature: aiNode.data.temperature ?? 0.7,
      });

      // Update AI node with output and mark as completed
      setNodes((nds) =>
        nds.map((n) =>
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

      // Follow graph to Output node
      const outputEdge = edges.find((e) => e.source === aiNode.id);
      if (outputEdge) {
        const outputNode = nodes.find(
          (n) => n.id === outputEdge.target && n.type === "output"
        );
        if (outputNode) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === outputNode.id
                ? { ...n, data: { ...n.data, result: response.data.output } }
                : n
            )
          );
        }
      }

      alert("Workflow executed successfully!");
    } catch (error: any) {
      // Mark AI node as failed
      const aiNode = nodes.find((n) => n.type === "ai");
      if (aiNode) {
        setNodes((nds) =>
          nds.map((n) =>
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

  const onConnect = (connection: Connection) =>
    setEdges((eds) => addEdge(connection, eds));

  const generateId = (prefix: string) => {
    return prefix + "_" + Math.random().toString(36).substring(2, 9);
  };

  const addNode = (type: string, label: string) => {
    const id = generateId(type);

    setNodes((nds) => [
      ...nds,
      {
        id,
        type,
        position: {
          x: Math.random() * 400 + 200,
          y: Math.random() * 200 + 200,
        },
        data: { label },
      },
    ]);
  };

  return (
    <>
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Save Workflow</h2>
            <input
              type="text"
              placeholder="Enter workflow name..."
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              autoFocus
              className="workflow-name-input"
            />
            <textarea
              placeholder="Enter workflow description (optional)..."
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="workflow-description-input"
              rows={3}
            />
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveConfirm}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="builder-nav">
        <div className="builder-nav-content">
          <div className="builder-nav-left">
            <button onClick={() => navigate("/")} className="nav-logo">
              CodeFlow AI
            </button>
            <button onClick={() => navigate("/dashboard")} className="nav-link">
              Dashboard
            </button>
          </div>
          <div className="builder-nav-right">
            <button onClick={save} className="btn-secondary btn-sm">
              💾 Save
            </button>
            <button
              onClick={runWorkflow}
              disabled={isExecuting}
              className="btn-primary btn-sm"
            >
              {isExecuting ? "⏳ Running..." : "▶️ Run Workflow"}
            </button>
          </div>
        </div>
      </nav>
      <div className={`visualbuilder-root ${selectedNode ? "panel-open" : ""}`}>
        {/* LEFT — ReactFlow (always full-size) */}
        <div className="visualbuilder-canvas">
          {/* Toolbar */}
          <NodeToolbar addNode={addNode} />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            fitView
            style={{ width: "100%", height: "100%" }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        {/* RIGHT — Panel (fixed overlay) */}
        {selectedNode && (
          <div className="node-editor-panel">
            <NodeEditorPanel
              node={selectedNode}
              closePanel={() => setSelectedNode(null)}
              updateNodeData={(id, newData) =>
                setNodes((nds) =>
                  nds.map((n) => (n.id === id ? { ...n, data: newData } : n))
                )
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
