/**
 * Layer Panel
 *
 * Purpose:
 * - Display a list of nodes as layers with visibility, lock, and delete controls.
 *
 * Role in the system:
 * - Provides a side panel for managing node ordering and quick actions.
 *
 * Key responsibilities:
 * - Render an ordered list of nodes with labels and icons.
 * - Support drag-and-drop reordering for non-layout nodes.
 * - Delegate updates and deletions through callback props.
 *
 * Important constraints and assumptions:
 * - Section and row nodes are treated as layout anchors and cannot be reordered.
 * - Hidden and locked states are stored in node data and toggled via updates.
 */

import { useState } from "react";
import type { Node } from "reactflow";

// ================================
// Types
// ================================
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

// ================================
// Component
// ================================
/**
 * Render and manage the layers list for the current page.
 */
export default function LayerPanel({
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeDelete,
  onReorderNodes,
  onUpdateNode,
}: LayerPanelProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  // ================================
  // Helpers
  // ================================
  /**
   * Return an icon for a given node type to aid visual scanning.
   */
  const getNodeIcon = (type: string) => {
    const iconStyle = {
      width: 16,
      height: 16,
      strokeWidth: 2,
      stroke: "currentColor",
      fill: "none",
    };

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

  /**
   * Provide a human-readable label for the layer list.
   */
  const getNodeLabel = (node: Node) => {
    return node.data?.label || node.data?.text || node.type || "Unnamed";
  };

  // ================================
  // Ordering
  // ================================
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === "section") return -1;
    if (b.type === "section") return 1;
    // Highest zIndex first so content stays above layout rows.
    const orderA = a.zIndex ?? a.data?.order ?? 0;
    const orderB = b.zIndex ?? b.data?.order ?? 0;
    return orderB - orderA;
  });

  // ================================
  // Drag and Drop
  // ================================
  /**
   * Start a drag operation for reorderable nodes only.
   */
  const handleDragStart = (e: React.DragEvent, node: Node) => {
    if (node.type === "section" || node.type === "row") return; // Layout nodes cannot be reordered
    setDraggedNode(node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  /**
   * Enable drop targets during drag operations.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {};

  /**
   * Complete the reorder by dispatching the dragged id and target index.
   */
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedNode) {
      onReorderNodes(draggedNode, targetIndex);
    }
    setDraggedNode(null);
  };

  /**
   * Clear drag state when the interaction ends.
   */
  const handleDragEnd = () => {
    setDraggedNode(null);
  };

  // ================================
  // Render
  // ================================
  return (
    <div
      style={{
        width: 260,
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
          padding: "12px",
          borderBottom: "1px solid #e5e7eb",
          fontWeight: 600,
          fontSize: 11,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          background: "#fafafa",
        }}
      >
        Layers
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px",
        }}
      >
        {sortedNodes.map((node, index) => {
          const isDragging = draggedNode === node.id;
          const canDrag = node.type !== "section" && node.type !== "row";

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
              className="layer-row"
              style={{
                padding: "6px 8px",
                marginBottom: 1,
                borderRadius: 6,
                cursor: canDrag ? "grab" : "pointer",
                backgroundColor:
                  selectedNode?.id === node.id
                    ? "#eff6ff"
                    : isDragging
                    ? "#f3f4f6"
                    : "transparent",
                border: "none",
                borderLeft:
                  selectedNode?.id === node.id
                    ? "2px solid #3b82f6"
                    : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                transition: "background-color 0.15s ease, border-color 0.15s ease",
                opacity: isDragging ? 0.5 : 1,
                minHeight: 32,
              }}
              onMouseEnter={(e) => {
                if (selectedNode?.id !== node.id && !isDragging) {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                }
                const actions = e.currentTarget.querySelector(
                  ".layer-actions"
                ) as HTMLElement;
                if (actions) {
                  actions.style.opacity = "1";
                }
                const deleteBtn = e.currentTarget.querySelector(
                  ".layer-delete"
                ) as HTMLElement;
                if (deleteBtn) {
                  deleteBtn.style.opacity = "1";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedNode?.id !== node.id && !isDragging) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
                const actions = e.currentTarget.querySelector(
                  ".layer-actions"
                ) as HTMLElement;
                if (actions && selectedNode?.id !== node.id) {
                  actions.style.opacity = "0.6";
                }
                const deleteBtn = e.currentTarget.querySelector(
                  ".layer-delete"
                ) as HTMLElement;
                if (deleteBtn) {
                  deleteBtn.style.opacity = "0";
                }
              }}
            >
              {/* Icon + Name (Left) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    color:
                      selectedNode?.id === node.id ? "#3b82f6" : "#9ca3af",
                    display: "flex",
                    flexShrink: 0,
                    transition: "color 0.15s ease",
                  }}
                >
                  {getNodeIcon(node.type || "")}
                </span>
                <span
                  style={{
                    color: node.data?.hidden
                      ? "#9ca3af"
                      : selectedNode?.id === node.id
                      ? "#111827"
                      : "#4b5563",
                    fontWeight: selectedNode?.id === node.id ? 500 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontStyle: node.data?.hidden ? "italic" : "normal",
                    transition: "color 0.15s ease",
                  }}
                >
                  {getNodeLabel(node)}
                </span>
              </div>

              {/* Actions (Right) */}
              <div
                className="layer-actions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  opacity: selectedNode?.id === node.id ? 1 : 0.6,
                  transition: "opacity 0.15s ease",
                }}
              >
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
                    borderRadius: 4,
                    transition: "background-color 0.15s ease, color 0.15s ease",
                    width: 24,
                    height: 24,
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title={node.data?.hidden ? "Show" : "Hide"}
                >
                  {node.data?.hidden ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
                    borderRadius: 4,
                    transition: "background-color 0.15s ease, color 0.15s ease",
                    width: 24,
                    height: 24,
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title={node.data?.locked ? "Unlock" : "Lock"}
                >
                  {node.data?.locked ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                </button>

                {/* Delete button (appears on hover) */}
                {node.type !== "section" && (
                  <button
                    className="layer-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNodeDelete(node.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 4,
                      transition:
                        "background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease",
                      width: 24,
                      height: 24,
                      justifyContent: "center",
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#fef2f2";
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#6b7280";
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
