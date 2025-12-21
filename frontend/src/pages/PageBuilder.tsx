import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactFlow, { Background, Controls, addEdge } from "reactflow";
import type { Connection, Node as ReactFlowNode } from "reactflow";
import "reactflow/dist/style.css";
import NodeToolbar from "../components/builder/NodeToolbar";
import PageTabs from "../components/builder/PageTabs";
import StartNode from "../components/builder/Nodes/StartNode";
import AINode from "../components/builder/Nodes/AINode";
import OutputNode from "../components/builder/Nodes/OutputNode";
import TextNode from "../components/builder/Nodes/TextNode";
import SectionNode from "../components/builder/Nodes/SectionNode";
import NodeEditorPanel from "../components/builder/NodeEditorPanel";
import { saveDiagram, getDiagram, executeWorkflow } from "../api/api";
import { buildTree } from "../utils/buildTree";
import { exportHTML } from "../utils/exportHtml";
import type { SiteSchema, PageSchema } from "../types/siteSchema";
import { createDefaultSite, createEmptyPage } from "../types/siteSchema";

const nodeTypes = {
  start: StartNode,
  ai: AINode,
  output: OutputNode,
  text: TextNode,
  section: SectionNode,
};

// Mode: "workflow" for AI execution, "builder" for page building
const MODE: "workflow" | "builder" = "builder";

export default function PageBuilder() {
  const [site, setSite] = useState<SiteSchema>(createDefaultSite());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");

  // Get active page
  const activePage = site.pages.find((p) => p.id === site.activePageId)!;
  const nodes = activePage.nodes;
  const edges = activePage.edges;

  // Update active page
  const updateActivePage = (updates: Partial<PageSchema>) => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === prev.activePageId ? { ...p, ...updates } : p
      ),
    }));
  };

  // Node/Edge change handlers
  const onNodesChange = (changes: any) => {
    import("reactflow").then(({ applyNodeChanges }) => {
      let newNodes = applyNodeChanges(changes, nodes);

      // Check if any nodes were deleted
      const hasDeletes = changes.some((c: any) => c.type === "remove");
      if (hasDeletes) {
        // Normalize order for all sections
        newNodes = normalizeOrder(newNodes, edges);
        // Normalize order for children of each section
        newNodes
          .filter((n: any) => n.type === "section")
          .forEach((section: any) => {
            normalizeOrder(newNodes, edges, section.id);
          });
      }

      // Highlight parent sections when child is selected
      const updatedNodes = newNodes.map((n: any) => {
        if (n.type === "section") {
          const hasSelectedChild = edges.some(
            (e) =>
              e.source === n.id &&
              newNodes.find(
                (child: any) => child.id === e.target && child.selected
              )
          );
          return {
            ...n,
            data: { ...n.data, isParentOfSelected: hasSelectedChild },
          };
        }
        return n;
      });

      updateActivePage({ nodes: updatedNodes });
    });
  };

  const onEdgesChange = (changes: any) => {
    import("reactflow").then(({ applyEdgeChanges }) => {
      updateActivePage({ edges: applyEdgeChanges(changes, edges) });
    });
  };

  const setNodes = (nodesOrUpdater: any) => {
    const newNodes =
      typeof nodesOrUpdater === "function"
        ? nodesOrUpdater(nodes)
        : nodesOrUpdater;
    updateActivePage({ nodes: newNodes });
  };

  const setEdges = (edgesOrUpdater: any) => {
    const newEdges =
      typeof edgesOrUpdater === "function"
        ? edgesOrUpdater(edges)
        : edgesOrUpdater;
    updateActivePage({ edges: newEdges });
  };

  // Page management
  const handlePageSelect = (pageId: string) => {
    setSite((prev) => ({ ...prev, activePageId: pageId }));
    setSelectedNode(null);
  };

  const handlePageAdd = () => {
    const newPageId = `page_${Date.now()}`;
    const pageName =
      prompt("Enter page name:") || `Page ${site.pages.length + 1}`;
    setSite((prev) => ({
      ...prev,
      pages: [...prev.pages, createEmptyPage(newPageId, pageName)],
      activePageId: newPageId,
    }));
  };

  const handlePageDelete = (pageId: string) => {
    setSite((prev) => {
      const newPages = prev.pages.filter((p) => p.id !== pageId);
      const newActiveId =
        prev.activePageId === pageId ? newPages[0].id : prev.activePageId;
      return { pages: newPages, activePageId: newActiveId };
    });
  };

  const handlePageRename = (pageId: string, newName: string) => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === pageId ? { ...p, name: newName } : p
      ),
    }));
  };

  useEffect(() => {
    if (id) {
      getDiagram(Number(id))
        .then((res) => {
          const raw = res.data && (res.data.diagram ?? res.data);
          if (raw) {
            const str = typeof raw === "string" ? raw : JSON.stringify(raw);
            const parsed = JSON.parse(str);

            // Check if it's multi-page format
            if (parsed.pages) {
              setSite(parsed);
            } else {
              // Legacy format: single page
              setSite({
                pages: [
                  {
                    id: "home",
                    name: "Home",
                    nodes: parsed.nodes || [],
                    edges: parsed.edges || [],
                  },
                ],
                activePageId: "home",
              });
            }
          }
        })
        .catch(() => console.log("No saved diagram yet."));
    }
  }, [id]);

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
      const { createWorkflow, saveDiagram } = await import("../api/api");
      const response = await createWorkflow({
        name: name,
        description: description,
        workflow: JSON.stringify(site),
      });

      const workflowId = response.data.id;
      if (workflowId) {
        await saveDiagram(workflowId, site as any);

        setShowSaveDialog(false);
        navigate(`/pageBuilder?id=${workflowId}`, { replace: true });
        alert("Site created and saved successfully!");
      } else {
        alert("Failed to create site - no ID returned");
      }
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
      setNodes((nds: any) =>
        nds.map((n: any) =>
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

      // Follow graph to Output node
      const outputEdge = edges.find((e) => e.source === aiNode.id);
      if (outputEdge) {
        const outputNode = nodes.find(
          (n) => n.id === outputEdge.target && n.type === "output"
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
      // Mark AI node as failed
      const aiNode = nodes.find((n) => n.type === "ai");
      if (aiNode) {
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

  const onConnect = (connection: Connection) => {
    const source = nodes.find((n) => n.id === connection.source);
    const target = nodes.find((n) => n.id === connection.target);

    if (!source || !target) return;

    // Rule: Only Sections can contain elements
    if (source.type !== "section") {
      alert("Only Sections can contain elements.");
      return;
    }

    // Rule: Each element can only belong to one Section
    const hasParent = edges.some((e) => e.target === target.id);
    if (hasParent) {
      alert("This element already belongs to a Section.");
      return;
    }

    setEdges((eds: any) => addEdge(connection, eds));
  };

  const handleExportHTML = () => {
    // Export all pages
    site.pages.forEach((page) => {
      const tree = buildTree(page.nodes, page.edges);
      const html = exportHTML(tree);

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

  const generateId = (prefix: string): string => {
    return prefix + "_" + Math.random().toString(36).substring(2, 9);
  };

  // Normalize order after deletions to prevent gaps
  const normalizeOrder = (
    nodeList: any[],
    edgeList: any[],
    parentId?: string
  ) => {
    const scoped = parentId
      ? nodeList.filter((n) =>
          edgeList.some((e) => e.source === parentId && e.target === n.id)
        )
      : nodeList.filter((n) => n.type === "section");

    scoped
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .forEach((n, index) => {
        n.data.order = index;
      });

    return nodeList;
  };

  const addNode = (type: string, label: string): void => {
    const id = generateId(type);

    let data: any = {};
    let position = {
      x: Math.random() * 400 + 200,
      y: Math.random() * 200 + 200,
    };

    if (type === "text") {
      // Auto-attach to nearest Section
      const section = nodes.find((n) => n.type === "section");

      // Count siblings to determine order
      const siblings = section
        ? nodes.filter((n) =>
            edges.some((e) => e.source === section.id && e.target === n.id)
          )
        : [];

      data = {
        text: "Sample Text",
        fontSize: 14,
        color: "#ffffff",
        order: siblings.length, // 👈 child order inside section
      };

      if (section) {
        // Position text inside section
        position = {
          x: section.position.x + 40,
          y: section.position.y + 40,
        };
      }
    } else if (type === "section") {
      // Count existing sections to determine order
      const sectionCount = nodes.filter((n) => n.type === "section").length;

      data = {
        label: label,
        padding: 40,
        backgroundColor: "#111111",
        order: sectionCount, // 👈 section stack order
      };
    } else {
      data = { label: type.toUpperCase(), order: 0 };
    }

    const newNode = {
      id,
      type,
      position,
      data,
    };

    setNodes((nds: any) => [...nds, newNode]);

    // Auto-create edge from Section to Text
    if (type === "text") {
      const section = nodes.find((n) => n.type === "section");
      if (section) {
        setEdges((eds: any) => [
          ...eds,
          { id: `${section.id}-${id}`, source: section.id, target: id },
        ]);
      }
    }
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
            {MODE === "builder" && (
              <button
                onClick={handleExportHTML}
                className="btn-secondary btn-sm"
              >
                📄 Export HTML
              </button>
            )}
            {MODE === "workflow" && (
              <button
                onClick={runWorkflow}
                disabled={isExecuting}
                className="btn-primary btn-sm"
              >
                {isExecuting ? "⏳ Running..." : "▶️ Run Workflow"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Page Tabs */}
      <PageTabs
        pages={site.pages}
        activePageId={site.activePageId}
        onPageSelect={handlePageSelect}
        onPageAdd={handlePageAdd}
        onPageRename={handlePageRename}
        onPageDelete={handlePageDelete}
      />

      <div className={`visualbuilder-root ${selectedNode ? "panel-open" : ""}`}>
        {/* LEFT — ReactFlow (always full-size) */}
        <div className="visualbuilder-canvas">
          {/* Toolbar */}
          <NodeToolbar addNode={addNode} mode={MODE} />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            defaultEdgeOptions={{
              style: { stroke: "transparent" },
              animated: false,
            }}
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
              updateNodeData={(id: string, newData: any) =>
                setNodes((nds: any) =>
                  nds.map((n: any) =>
                    n.id === id ? { ...n, data: newData } : n
                  )
                )
              }
              edges={edges}
              nodes={nodes}
            />
          </div>
        )}
      </div>
    </>
  );
}
