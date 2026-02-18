/**
 * Alignment Toolbar
 *
 * Purpose:
 * - Provide on-canvas alignment, distribution, and clipboard controls.
 *
 * Role in the system:
 * - Appears when nodes are selected to perform layout operations.
 *
 * Key responsibilities:
 * - Gate controls based on selection context (multiple nodes, section selected).
 * - Delegate alignment/distribution/clipboard actions to parent handlers.
 * - Render column controls for section nodes when supported.
 *
 * Important constraints and assumptions:
 * - Toolbar is hidden when no selection is present or visibility is disabled.
 * - All actions are executed via callbacks to avoid local state coupling.
 */

import type { Node } from "reactflow";

// ================================
// Types
// ================================
interface AlignmentToolbarProps {
  selectedNodes: Node[];
  onAlign: (type: string) => void;
  onDistribute: (type: string) => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSetColumns?: (count: number) => void;
  onColumnAlign?: (type: string) => void;
  visible: boolean;
}

// ================================
// Component
// ================================
/**
 * Contextual toolbar for node alignment and layout actions.
 */
export default function AlignmentToolbar({
  selectedNodes,
  onAlign,
  onDistribute,
  onDuplicate,
  onCopy,
  onPaste,
  onSetColumns,
  onColumnAlign,
  visible,
}: AlignmentToolbarProps) {
  // Hide the toolbar when there is no actionable selection.
  if (!visible || selectedNodes.length === 0) return null;

  const hasMultipleNodes = selectedNodes.length > 1;
  const isSingleColumn =
    selectedNodes.length === 1 && selectedNodes[0].type === "column";
  const showAlign = hasMultipleNodes || isSingleColumn;
  const showDistribute = hasMultipleNodes && !isSingleColumn;
  const columnMain = isSingleColumn
    ? selectedNodes[0].data?.justifyContent ?? "flex-start"
    : null;
  const columnCross = isSingleColumn
    ? selectedNodes[0].data?.alignItems ?? "flex-start"
    : null;

  const handleAlignClick = (type: string) => {
    if (isSingleColumn && onColumnAlign) {
      onColumnAlign(type);
    } else {
      onAlign(type);
    }
  };

  const isActive = (type: string) => {
    if (!isSingleColumn) return false;
    switch (type) {
      case "left":
        return columnCross === "flex-start";
      case "center-h":
        return columnCross === "center";
      case "right":
        return columnCross === "flex-end";
      case "top":
        return columnMain === "flex-start";
      case "center-v":
        return columnMain === "center";
      case "bottom":
        return columnMain === "flex-end";
      case "stretch":
        return columnCross === "stretch";
      case "space-between":
        return columnMain === "space-between";
      default:
        return false;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "8px 12px",
        display: "flex",
        gap: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      {showAlign && (
        <>
          <div
            style={{
              display: "flex",
              gap: 4,
              paddingRight: 8,
              borderRight: "1px solid #e5e7eb",
            }}
          >
            <ToolbarButton
              onClick={() => handleAlignClick("left")}
              title="Align Left"
              active={isActive("left")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="18" y2="18" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleAlignClick("center-h")}
              title="Align Center"
              active={isActive("center-h")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleAlignClick("right")}
              title="Align Right"
              active={isActive("right")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="9" y1="12" x2="21" y2="12" />
                <line x1="6" y1="18" x2="21" y2="18" />
              </svg>
            </ToolbarButton>
            {isSingleColumn && (
              <ToolbarButton
                onClick={() => handleAlignClick("stretch")}
                title="Stretch (Cross Axis)"
                active={isActive("stretch")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="2" />
                  <rect x="3" y="17" width="18" height="2" />
                  <rect x="6" y="9" width="12" height="6" />
                </svg>
              </ToolbarButton>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              paddingRight: 8,
              borderRight: "1px solid #e5e7eb",
            }}
          >
            <ToolbarButton
              onClick={() => handleAlignClick("top")}
              title="Align Top"
              active={isActive("top")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="3" x2="6" y2="21" />
                <line x1="12" y1="3" x2="12" y2="15" />
                <line x1="18" y1="3" x2="18" y2="18" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleAlignClick("center-v")}
              title="Align Middle"
              active={isActive("center-v")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="3" x2="6" y2="21" />
                <line x1="12" y1="6" x2="12" y2="18" />
                <line x1="18" y1="4" x2="18" y2="20" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleAlignClick("bottom")}
              title="Align Bottom"
              active={isActive("bottom")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="3" x2="6" y2="21" />
                <line x1="12" y1="9" x2="12" y2="21" />
                <line x1="18" y1="6" x2="18" y2="21" />
              </svg>
            </ToolbarButton>
            {isSingleColumn && (
              <ToolbarButton
                onClick={() => handleAlignClick("space-between")}
                title="Space Between (Main Axis)"
                active={isActive("space-between")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="6" height="4" />
                  <rect x="15" y="16" width="6" height="4" />
                  <line x1="6" y1="10" x2="6" y2="14" />
                  <line x1="18" y1="6" x2="18" y2="10" />
                </svg>
              </ToolbarButton>
            )}
          </div>
          {showDistribute && (
            <div
              style={{
                display: "flex",
                gap: 4,
                paddingRight: 8,
              borderRight: "1px solid #e5e7eb",
              }}
            >
              <ToolbarButton
                onClick={() => onDistribute("horizontal")}
                title="Distribute Horizontally"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="9" width="4" height="6" />
                  <rect x="10" y="9" width="4" height="6" />
                  <rect x="17" y="9" width="4" height="6" />
                </svg>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => onDistribute("vertical")}
                title="Distribute Vertically"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="3" width="6" height="4" />
                  <rect x="9" y="10" width="6" height="4" />
                  <rect x="9" y="17" width="6" height="4" />
                </svg>
              </ToolbarButton>
            </div>
          )}
        </>
      )}
      {!isSingleColumn && (
        <div style={{ display: "flex", gap: 4 }}>
          <ToolbarButton onClick={onCopy} title="Copy (Ctrl+C)">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={onPaste} title="Paste (Ctrl+V)">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="8" y="4" width="8" height="4" rx="1" />
              <path d="M8 2v2" />
              <path d="M16 2v2" />
              <rect x="6" y="6" width="12" height="14" rx="2" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={onDuplicate} title="Duplicate (Ctrl+D)">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              <line x1="13" y1="13" x2="17" y2="13" />
              <line x1="13" y1="17" x2="17" y2="17" />
            </svg>
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}

// ================================
// Subcomponents
// ================================
/**
 * Basic toolbar button with hover styling and optional active state.
 */
function ToolbarButton({
  onClick,
  title,
  children,
  active = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? "#eff6ff" : "#ffffff",
        border: `1px solid ${active ? "#3b82f6" : "#e5e7eb"}`,
        borderRadius: 4,
        padding: "6px 8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "#3b82f6" : "#374151",
        transition: "all 0.1s ease",
      }}
      onMouseEnter={(e) => {
        // Hover styles are applied inline to avoid external CSS dependencies.
        if (!active) {
          e.currentTarget.style.backgroundColor = "#f9fafb";
          e.currentTarget.style.borderColor = "#3b82f6";
          e.currentTarget.style.color = "#3b82f6";
        }
      }}
      onMouseLeave={(e) => {
        // Restore base styles to reflect active state correctly.
        e.currentTarget.style.backgroundColor = active ? "#eff6ff" : "#ffffff";
        e.currentTarget.style.borderColor = active ? "#3b82f6" : "#e5e7eb";
        e.currentTarget.style.color = active ? "#3b82f6" : "#374151";
      }}
    >
      {children}
    </button>
  );
}
