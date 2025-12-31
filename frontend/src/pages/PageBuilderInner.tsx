import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactFlow, { Background, Controls } from "reactflow";
import type { Node as ReactFlowNode } from "reactflow";
import "reactflow/dist/style.css";

import NodeToolbar from "../components/builder/NodeToolbar";
import PageTabs from "../components/builder/PageTabs";
import StartNode from "../components/builder/Nodes/StartNode";
import AINode from "../components/builder/Nodes/AINode";
import OutputNode from "../components/builder/Nodes/OutputNode";
import TextNode from "../components/builder/Nodes/TextNode";
import SectionNode from "../components/builder/Nodes/SectionNode";
import ButtonNode from "../components/builder/Nodes/ButtonNode";
import NodeEditorPanel from "../components/builder/NodeEditorPanel";
import SaveWorkflowDialog from "../components/builder/dialogs/SaveWorkflowDialog";

import { useSiteState } from "../components/builder/hooks/useSiteState";
import { useNodeOperations } from "../components/builder/hooks/useNodeOperations";
import { useColumnDropZones } from "../components/builder/hooks/useColumnDropZones";
import { useWorkflowOperations } from "../components/builder/hooks/useWorkflowOperations";

// Mode: "workflow" for AI execution, "builder" for page building
const MODE: "workflow" | "builder" = "builder";

// ✅ Static nodeTypes - defined ONCE outside component (referential equality preserved)
const nodeTypes = {
  start: StartNode,
  ai: AINode,
  output: OutputNode,
  text: TextNode,
  section: SectionNode,
  button: ButtonNode,
};

export default function PageBuilderInner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);

  // 🎯 Clean hook-based architecture
  const {
    site,
    setSite,
    activePage,
    nodes,
    edges,
    updateActivePage,
    setNodes,
    handlePageSelect,
    handlePageAdd,
    handlePageDelete,
    handlePageRename,
  } = useSiteState(id);

  const { onNodesChange, onEdgesChange, onConnect, addNode } =
    useNodeOperations(activePage, updateActivePage);

  const {
    registerColumnRect,
    handleMoveEnd,
    handleNodeDrag,
    handleNodeDragStop,
    viewportVersion,
    hoverState,
  } = useColumnDropZones(setSite, nodes, setNodes);

  const hasFrame = nodes.some((n: any) => n.type === "section");

  const { save, handleExportHTML, runWorkflow, isExecuting, dialogProps } =
    useWorkflowOperations(id, site, activePage, setNodes);


  return (
    <>
      <SaveWorkflowDialog {...dialogProps} />

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
          <NodeToolbar addNode={addNode} mode={MODE} hasFrame={hasFrame} />

          {!hasFrame ? (
            <div
              className="empty-canvas"
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
                color: "#6b7280",
              }}
            >
              <h2>Add a Frame to get started</h2>
              <button
                className="btn-primary"
                onClick={() => addNode("section", "Frame")}
              >
                ➕ Add Frame
              </button>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes.map((n: any) => {
                  if (n.type === "section") {
                    return {
                      ...n,
                      zIndex: 0,
                      draggable: false,
                      data: {
                        ...n.data,
                        _allNodes: nodes,
                        _registerColumnRect: registerColumnRect,
                        _viewportVersion: viewportVersion,
                        _hoverState: hoverState,
                      },
                    };
                  }
                  return {
                    ...n,
                    zIndex: 1,
                  };
                })}
              edges={MODE === "builder" ? [] : edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onEdgesChange={MODE === "builder" ? () => {} : onEdgesChange}
              onConnect={MODE === "builder" ? () => {} : onConnect}
              isValidConnection={() => MODE === "workflow"}
              nodesConnectable={MODE === "workflow"}
              nodesDraggable={true}
              onNodeDragStart={(_, node) => setSelectedNode(node)}
              onNodeDrag={(_, node) => handleNodeDrag(node)}
              onNodeDragStop={(event, node) => handleNodeDragStop(event, node)}
              defaultEdgeOptions={{
                style: { stroke: "transparent" },
                animated: false,
              }}
              fitView
              style={{ width: "100%", height: "100%" }}
              onMoveEnd={handleMoveEnd}
            >
              <Background />
              <Controls />
            </ReactFlow>
          )}
        </div>

        {selectedNode && (
          <div className="node-editor-panel">
            <NodeEditorPanel
              node={nodes.find((n: any) => n.id === selectedNode.id) || selectedNode}
              closePanel={() => setSelectedNode(null)}
              updateNodeData={(id: string, newData: any) => {
                const node = nodes.find((n: any) => n.id === id);

                if (
                  node?.type === "columnsSection" &&
                  newData.columns !== node.data.columns
                ) {
                  return;
                }

                setNodes((nds: any) =>
                  nds.map((n: any) =>
                    n.id === id ? { ...n, data: newData } : n
                  )
                );
              }}
              updateNodes={(updater: (nodes: any[]) => any[]) => {
                setNodes(updater);
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
