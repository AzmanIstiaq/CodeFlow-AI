import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactFlow, { Background, Controls, useReactFlow } from "reactflow";
import type { Node as ReactFlowNode } from "reactflow";
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
import SaveWorkflowDialog from "../components/builder/dialogs/SaveWorkFlowDialog";

import { useSiteState } from "../components/builder/hooks/useSiteState";
import { useNodeOperations } from "../components/builder/hooks/useNodeOperations";
import { useColumnDropZones } from "../components/builder/hooks/useColumnDropZones";
import { useWorkflowOperations } from "../components/builder/hooks/useWorkFlowOperations";

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

export default function PageBuilderInner() {
  const reactFlow = useReactFlow();
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

  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateColumnsCount,
  } = useNodeOperations(activePage, updateActivePage);

  const {
    registerColumnRect,
    addNodeToColumn,
    removeNodeFromColumn,
    handleMoveEnd,
    handleNodeDrag,
    handleNodeDragStop,
    viewportVersion,
  } = useColumnDropZones(site, setSite, nodes, setNodes);

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
          <NodeToolbar addNode={addNode} mode={MODE} />

          <ReactFlow
            nodes={nodes
              .filter((n: any) => !n.data?._ownedByColumn)
              .map((n: any) => {
                if (n.type === "columnsSection") {
                  const hasChildren =
                    Object.values(n.data?.children ?? {}).flat().length > 0;
                  return {
                    ...n,
                    draggable: !hasChildren,
                    // dragHandle: ".columns-drag-handle",
                    data: {
                      ...n.data,
                      _allNodes: nodes,
                      _nodePosition: n.position,
                      _onAddNodeToColumn: (nodeId: string, colIndex: number) =>
                        addNodeToColumn(n.id, nodeId, colIndex),
                      _onRemoveNodeFromColumn: removeNodeFromColumn,
                      _registerColumnRect: (colIndex: number, rect: DOMRect) =>
                        registerColumnRect(n.id, colIndex, rect),
                      _viewportVersion: viewportVersion,
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
            onNodeDrag={(_, node) => handleNodeDrag(node)}
            onNodeDragStop={(_, node) => handleNodeDragStop(_, node)}
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
