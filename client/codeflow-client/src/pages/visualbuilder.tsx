import React from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import type { Connection } from "reactflow";
import "reactflow/dist/style.css";

export default function VisualBuilder() {
  const [nodes, , onNodesChange] = useNodesState([
    {
      id: "1",
      position: { x: 100, y: 100 },
      data: { label: "Start Node" },
      type: "input",
    },
    {
      id: "2",
      position: { x: 400, y: 100 },
      data: { label: "AI Node" },
    },
    {
      id: "3",
      position: { x: 700, y: 100 },
      data: { label: "Output Node" },
      type: "output",
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = (connection: Connection) =>
    setEdges((eds) => addEdge(connection, eds));

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#121212",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
