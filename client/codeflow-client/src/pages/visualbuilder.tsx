import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ReactFlow, { Background, Controls, addEdge, useEdgesState, useNodesState } from "reactflow";
import type { Connection, Node as ReactFlowNode } from "reactflow";
import "reactflow/dist/style.css";
import NodeToolbar from "../components/builder/NodeToolbar";
import StartNode from "../components/builder/CustomNodes/StartNode";
import AINode from "../components/builder/CustomNodes/AINode";
import OutputNode from "../components/builder/CustomNodes/OutputNode";
import NodeEditorPanel from "../components/builder/NodeEditorPanel";
import { saveDiagram, getDiagram } from "../api/api";
import "../styles/visualbuilder.css";

const nodeTypes = {
    start: StartNode,
    ai: AINode,
    output: OutputNode,
};

export default function VisualBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);

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
    if (!id) return;
    await saveDiagram(Number(id), { nodes, edges });
    alert("Diagram saved successfully!");
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
      position: { x: Math.random() * 400 + 200, y: Math.random() * 200 + 200 },
      data: { label },
    },
  ]);
};


  return (
    <div className={`visualbuilder-root ${selectedNode ? "panel-open" : ""}`}>
      {/* LEFT — ReactFlow (always full-size) */}
      <div className="visualbuilder-canvas">
        {/* Toolbar */}
        <NodeToolbar addNode={addNode} />

        {/* Save Button - shifts when panel open via .panel-open */}
        <button className="save-button" onClick={save}>💾 Save Diagram</button>

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
              setNodes(nds => nds.map(n => (n.id === id ? { ...n, data: newData } : n)))
            }
          />
        </div>
      )}
    </div>
  );

}
