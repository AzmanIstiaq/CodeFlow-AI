import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useReactFlow,
} from "reactflow";
import type { Connection, Node as ReactFlowNode } from "reactflow";
import "reactflow/dist/style.css";

import NodeToolbar from "../components/builder/NodeToolbar";
import PageTabs from "../components/builder/PageTabs";
import StartNode from "../components/builder/Nodes/StartNode";
import AINode from "../components/builder/Nodes/AINode";
import OutputNode from "../components/builder/Nodes/OutputNode";
import TextNode from "../components/builder/Nodes/TextNode";
import SectionNode from "../components/builder/Nodes/SectionNode";
import ColumnsSectionNode from "../components/builder/Nodes/ColumnsSectionNode";
import ButtonNode from "../components/builder/Nodes/ButtonNode";
import NodeEditorPanel from "../components/builder/NodeEditorPanel";

import { saveDiagram, getDiagram, executeWorkflow } from "../api/api";
import { buildTree } from "../utils/buildTree";
import { exportHTML } from "../utils/exportHtml";
import type { SiteSchema, PageSchema } from "../types/siteSchema";
import { createDefaultSite, createEmptyPage } from "../types/siteSchema";

// Mode: "workflow" for AI execution, "builder" for page building
const MODE: "workflow" | "builder" = "builder";

// ✅ Static nodeTypes - defined ONCE outside component (referential equality preserved)
const nodeTypes = {
  start: StartNode,
  ai: AINode,
  output: OutputNode,
  text: TextNode,
  section: SectionNode,
  columnsSection: ColumnsSectionNode,
  button: ButtonNode,
};

const INVALID_COLUMN_CHILD_TYPES = new Set<string>([
  "section",
  "columnsSection",
  "start",
  "ai",
  "output",
]);

export default function PageBuilderInner() {
  const reactFlow = useReactFlow();
  const [site, setSite] = useState<SiteSchema>(createDefaultSite());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");
  const viewportVersionRef = useRef(0);

  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");

  // Track all column bounding rects for drop detection
  const columnRectsRef = useRef<Record<string, Record<number, DOMRect>>>({});

  // Register a column's bounding rect
  const registerColumnRect = (
    sectionId: string,
    colIndex: number,
    rect: DOMRect
  ) => {
    const topLeft = reactFlow.screenToFlowPosition({
      x: rect.left,
      y: rect.top,
    });

    const bottomRight = reactFlow.screenToFlowPosition({
      x: rect.right,
      y: rect.bottom,
    });

    if (!columnRectsRef.current[sectionId]) {
      columnRectsRef.current[sectionId] = {};
    }

    columnRectsRef.current[sectionId][colIndex] = {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
    } as any;
  };

  // Get active page
  const activePage = site.pages.find((p) => p.id === site.activePageId)!;
  const nodes = activePage.nodes;
  const edges = activePage.edges;

  const updateActivePage = (updates: Partial<PageSchema>) => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === prev.activePageId ? { ...p, ...updates } : p
      ),
    }));
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

  // ✅ Add node into a specific column (and update the columnsSection children map)
  const addNodeToColumn = (
    columnsSectionId: string,
    nodeId: string,
    columnIndex: number
  ) => {
    const dragged = nodes.find((n: any) => n.id === nodeId);
    if (!dragged || !dragged.type) return;

    // Block illegal nesting
    if (INVALID_COLUMN_CHILD_TYPES.has(dragged.type)) {
      console.warn(
        "❌ Cannot drop this node type into a column:",
        dragged.type
      );
      return;
    }

    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => {
        if (page.id !== prev.activePageId) return page;

        const nextNodes = page.nodes.map((node: any) => {
          // 1) Mark dropped node as owned by a columnsSection (so ReactFlow won't render it)
          if (node.id === nodeId) {
            return {
              ...node,
              position: { x: 0, y: 0 }, // 🔑 reset
              positionAbsolute: { x: 0, y: 0 }, // 🔑 reset
              draggable: false, // optional but recommended
              data: {
                ...node.data,
                _ownedByColumn: columnsSectionId,
                _columnIndex: columnIndex,
              },
            };
          }

          // 2) For EVERY columnsSection: remove this nodeId from children (prevents duplicates across sections)
          if (node.type === "columnsSection") {
            const data = node.data ?? {};
            const children = { ...(data.children ?? {}) };

            Object.keys(children).forEach((k) => {
              children[k] = (children[k] ?? []).filter(
                (id: string) => id !== nodeId
              );
            });

            // 3) Only for the target columnsSection: add into the correct column
            if (node.id === columnsSectionId) {
              if (!children[columnIndex]) children[columnIndex] = [];
              if (!children[columnIndex].includes(nodeId)) {
                children[columnIndex] = [...children[columnIndex], nodeId];
              }
            }

            return {
              ...node,
              data: {
                ...data,
                children,
              },
            };
          }

          return node;
        });

        // Remove edges connected to dropped node (no longer edge-driven)
        const nextEdges = page.edges.filter(
          (e: any) => e.source !== nodeId && e.target !== nodeId
        );

        return { ...page, nodes: nextNodes, edges: nextEdges };
      }),
    }));
  };

  // Node/Edge change handlers
  const onNodesChange = (changes: any) => {
    import("reactflow").then(({ applyNodeChanges }) => {
      let newNodes = applyNodeChanges(changes, nodes);

      const hasDeletes = changes.some((c: any) => c.type === "remove");
      if (hasDeletes) {
        newNodes = normalizeOrder(newNodes, edges);
        newNodes
          .filter((n: any) => n.type === "section")
          .forEach((section: any) => {
            normalizeOrder(newNodes, edges, section.id);
          });
      }

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
    if (!id) return;

    getDiagram(Number(id))
      .then((res) => {
        const raw = res.data && (res.data.diagram ?? res.data);
        if (!raw) return;

        const str = typeof raw === "string" ? raw : JSON.stringify(raw);
        const parsed = JSON.parse(str);

        if (parsed.pages) {
          setSite(parsed);
        } else {
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
      })
      .catch(() => console.log("No saved diagram yet."));
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

    if (isExecuting) return;

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
    const source = nodes.find((n: any) => n.id === connection.source);
    const target = nodes.find((n: any) => n.id === connection.target);

    if (!source || !target) return;

    if (source.type !== "section") {
      alert("Only Sections can contain elements.");
      return;
    }

    const hasParent = edges.some((e: any) => e.target === target.id);
    if (hasParent) {
      alert("This element already belongs to a Section.");
      return;
    }

    setEdges((eds: any) => addEdge(connection, eds));
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

  const generateId = (prefix: string): string => {
    return prefix + "_" + Math.random().toString(36).substring(2, 9);
  };

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

    if (type === "button") {
      const section = nodes.find((n: any) => n.type === "section");
      if (!section) {
        alert("Add a Section before adding a Button.");
        return;
      }

      const siblings = nodes.filter((n: any) =>
        edges.some((e: any) => e.source === section.id && e.target === n.id)
      );
      data = {
        label: "Click Me",
        href: "#",
        variant: "primary",
        order: siblings.length,
      };

      const newNode = {
        id,
        type: "button",
        position: {
          x: section.position.x + 40,
          y: section.position.y + 80 + siblings.length * 40,
        },
        data,
      };

      setNodes((nds: any) => [...nds, newNode]);
      setEdges((eds: any) => [
        ...eds,
        { id: `${section.id}-${id}`, source: section.id, target: id },
      ]);
      return;
    }

    if (type === "text") {
      const section = nodes.find((n: any) => n.type === "section");
      const siblings = section
        ? nodes.filter((n: any) =>
            edges.some((e: any) => e.source === section.id && e.target === n.id)
          )
        : [];

      data = {
        text: "Sample Text",
        fontSize: 14,
        color: "#ffffff",
        order: siblings.length,
      };

      if (section) {
        position = { x: section.position.x + 40, y: section.position.y + 40 };
      }
    } else if (type === "section") {
      const sectionCount = nodes.filter(
        (n: any) => n.type === "section"
      ).length;
      data = {
        label,
        padding: 40,
        gap: 16,
        align: "start",
        maxWidth: 960,
        backgroundColor: "#000000",
        order: sectionCount,
      };
    } else if (type === "columnsSection") {
      const sectionCount = nodes.filter(
        (n: any) => n.type === "section" || n.type === "columnsSection"
      ).length;
      data = {
        label: "Columns Section",
        columns: 2,
        gap: 24,
        align: "start",
        maxWidth: 960,
        padding: 32,
        backgroundColor: "#000000",
        order: sectionCount,
        children: { 0: [], 1: [] },
      };
    } else {
      data = { label: type.toUpperCase(), order: 0 };
    }

    const newNode = { id, type, position, data };
    setNodes((nds: any) => [...nds, newNode]);

    if (type === "text") {
      const section = nodes.find((n: any) => n.type === "section");
      if (section) {
        setEdges((eds: any) => [
          ...eds,
          { id: `${section.id}-${id}`, source: section.id, target: id },
        ]);
      }
    }
  };

  const updateColumnsCount = (nodeId: string, newCount: number) => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => {
        if (page.id !== prev.activePageId) return page;

        return {
          ...page,
          nodes: page.nodes.map((n: any) => {
            if (n.id === nodeId && n.type === "columnsSection") {
              const nextChildren = { ...(n.data.children ?? {}) };

              for (let i = 0; i < newCount; i++)
                if (!nextChildren[i]) nextChildren[i] = [];
              Object.keys(nextChildren).forEach((k) => {
                if (Number(k) >= newCount) delete nextChildren[k];
              });

              return {
                ...n,
                data: { ...n.data, columns: newCount, children: nextChildren },
              };
            }
            return n;
          }),
        };
      }),
    }));
  };

  // Track positions of columnsSection nodes for drop rect recalculation
  const columnsSectionPositions = nodes
    .filter((n: any) => n.type === "columnsSection")
    .map((n: any) => ({ id: n.id, position: n.position }));

  // Register column rects whenever nodes move or zoom changes
  useEffect(() => {
    nodes.forEach((node: any) => {
      if (node.type === "columnsSection" && node.data && node.data.columns) {
        for (let i = 0; i < node.data.columns; i++) {
          const colElem = document.getElementById(`column-${node.id}-${i}`);
          if (colElem) {
            const rect = colElem.getBoundingClientRect();
            registerColumnRect(node.id, i, rect);
          }
        }
      }
    });
  }, [columnsSectionPositions, reactFlow]);

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

      <PageTabs
        pages={site.pages}
        activePageId={site.activePageId}
        onPageSelect={handlePageSelect}
        onPageAdd={handlePageAdd}
        onPageRename={handlePageRename}
        onPageDelete={handlePageDelete}
      />

      <div className={`visualbuilder-root ${selectedNode ? "panel-open" : ""}`}>
        <div className="visualbuilder-canvas">
          <NodeToolbar addNode={addNode} mode={MODE} />

          <ReactFlow
            nodes={nodes
              .filter((n: any) => !n.data?._ownedByColumn)
              .map((n: any) => {
                if (n.type === "columnsSection") {
                  return {
                    ...n,
                    data: {
                      ...n.data,
                      _allNodes: nodes,
                      _nodePosition: n.position,
                      _onAddNodeToColumn: (nodeId: string, colIndex: number) =>
                        addNodeToColumn(n.id, nodeId, colIndex),
                      _registerColumnRect: (colIndex: number, rect: DOMRect) =>
                        registerColumnRect(n.id, colIndex, rect),
                    },
                  };
                }
                return n;
              })}
            edges={MODE === "builder" ? [] : edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={MODE === "builder" ? () => {} : onEdgesChange}
            onConnect={MODE === "builder" ? () => {} : onConnect}
            isValidConnection={() => MODE === "workflow"}
            nodesConnectable={MODE === "workflow"}
            nodesDraggable={true}
            onNodeDrag={(_, node) => {
              if (INVALID_COLUMN_CHILD_TYPES.has(node.type!)) return;
              if (!node.positionAbsolute || !node.width || !node.height) return;

              const nodeRect = {
                left: node.positionAbsolute.x,
                right: node.positionAbsolute.x + node.width,
                top: node.positionAbsolute.y,
                bottom: node.positionAbsolute.y + node.height,
              };

              for (const [sectionId, columns] of Object.entries(
                columnRectsRef.current
              )) {
                for (const [colIndex, rect] of Object.entries(columns)) {
                  const overlaps =
                    nodeRect.right > rect.left &&
                    nodeRect.left < rect.right &&
                    nodeRect.bottom > rect.top &&
                    nodeRect.top < rect.bottom;

                  if (overlaps) {
                    // 🔑 CLAIM OWNERSHIP IMMEDIATELY
                    addNodeToColumn(sectionId, node.id, Number(colIndex));
                    return;
                  }
                }
              }
            }}
            defaultEdgeOptions={{
              style: { stroke: "transparent" },
              animated: false,
            }}
            fitView
            style={{ width: "100%", height: "100%" }}
            onMoveEnd={() => {
              viewportVersionRef.current += 1;
              columnRectsRef.current = {};

              setNodes((nds: any) =>
                nds.map((n: any) =>
                  n.type === "columnsSection"
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          _viewportVersion: viewportVersionRef.current,
                        },
                      }
                    : n
                )
              );
            }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div className="node-editor-panel">
            <NodeEditorPanel
              node={selectedNode}
              closePanel={() => setSelectedNode(null)}
              updateNodeData={(id: string, newData: any) => {
                const node = nodes.find((n: any) => n.id === id);

                if (
                  node?.type === "columnsSection" &&
                  newData.columns !== node.data.columns
                ) {
                  updateColumnsCount(id, newData.columns);
                  return;
                }

                setNodes((nds: any) =>
                  nds.map((n: any) =>
                    n.id === id ? { ...n, data: newData } : n
                  )
                );
              }}
              edges={edges}
              nodes={nodes}
            />
          </div>
        )}
      </div>
    </>
  );
}
