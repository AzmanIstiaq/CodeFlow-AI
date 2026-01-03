import { useState } from "react";
import type { Node } from "reactflow";

interface LayerPanelProps {
  nodes: Node[];
  selectedNode: Node | null;
  onNodeSelect: (node: Node) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeVisibilityToggle: (nodeId: string) => void;
  onNodeLock: (nodeId: string) => void;
  onReorderNodes: (nodeId: string, targetIndex: number) => void;
  onUpdateNode: (nodeId: string, updates: any) => void;
}

export default function LayerPanel({
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeDelete,
  onReorderNodes,
  onUpdateNode,
}: LayerPanelProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const getNodeIcon = (type: string) => {
    const iconStyle = { width: 16, height: 16, strokeWidth: 2, stroke: "currentColor", fill: "none" };
    
    switch (type) {
      case "section":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
      case "text":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <path d="M4 7V4h16v3M9 20h6M12 4v16" />
          </svg>
        );
      case "button":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <rect x="3" y="8" width="18" height="8" rx="4" />
          </svg>
        );
      case "image":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        );
      case "container":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        );
      case "shape":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      default:
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <path d="M13 2v7h7" />
          </svg>
        );
    }
  };

  const getNodeLabel = (node: Node) => {
    return node.data?.label || node.data?.text || node.type || "Unnamed";
  };

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === "section") return -1;
    if (b.type === "section") return 1;
    // Sort by z-index or order if available
    const orderA = a.data?.order ?? a.zIndex ?? 0;
    const orderB = b.data?.order ?? b.zIndex ?? 0;
    return orderA - orderB;
  });

  const handleDragStart = (e: React.DragEvent, node: Node) => {
    if (node.type === "section") return; // Don't allow dragging section nodes
    setDraggedNode(node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedNode) {
      onReorderNodes(draggedNode, targetIndex);
    }
    setDraggedNode(null);
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
  };

  return (
    <div
      style={{
        width: 240,
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #e5e7eb",
          fontWeight: 500,
          fontSize: 11,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Layers
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
        }}
      >
        {sortedNodes.map((node, index) => {
          const isDragging = draggedNode === node.id;
          const canDrag = node.type !== "section";
          
          return (
          <div
            key={node.id}
            draggable={canDrag}
            onDragStart={(e) => handleDragStart(e, node)}
            onDragOver={(e) => handleDragOver(e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onNodeSelect(node)}
            style={{
              padding: "6px 8px",
              marginBottom: 2,
              borderRadius: 4,
              cursor: canDrag ? "grab" : "pointer",
              backgroundColor:
                selectedNode?.id === node.id ? "#e0e7ff" : 
                isDragging ? "#f3f4f6" :
                "transparent",
              border: "none",
              borderLeft: selectedNode?.id === node.id ? "2px solid #3b82f6" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              transition: "all 0.1s ease",
              opacity: isDragging ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (selectedNode?.id !== node.id && !isDragging) {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedNode?.id !== node.id && !isDragging) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateNode(node.id, { hidden: !node.data?.hidden });
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: node.data?.hidden ? "#d1d5db" : "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  opacity: node.data?.hidden ? 0.5 : 1,
                }}
                title={node.data?.hidden ? "Show" : "Hide"}
              >
                {node.data?.hidden ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
              
              {/* Lock toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateNode(node.id, { locked: !node.data?.locked });
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: node.data?.locked ? "#3b82f6" : "#6b7280",
                  display: "flex",
                  alignItems: "center",
                }}
                title={node.data?.locked ? "Unlock" : "Lock"}
              >
                {node.data?.locked ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: selectedNode?.id === node.id ? "#3b82f6" : "#6b7280", display: "flex" }}>
                {getNodeIcon(node.type || "")}
              </span>
              <span
                style={{
                  color: selectedNode?.id === node.id ? "#111827" : "#4b5563",
                  fontWeight: selectedNode?.id === node.id ? 500 : 400,
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {getNodeLabel(node)}
              </span>
            </div>
            {node.type !== "section" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeDelete(node.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  opacity: 0,
                  transition: "opacity 0.1s ease",
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        );
        })}
      </div>
    </div>
  );
}
