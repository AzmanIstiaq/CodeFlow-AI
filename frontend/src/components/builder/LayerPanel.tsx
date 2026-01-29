/**
 * Layer Panel
 *
 * Purpose:
 * - Display a tree of nodes with visibility and lock controls.
 *
 * Role in the system:
 * - Read-only outline of the document hierarchy for quick selection.
 *
 * Key responsibilities:
 * - Render nodes in document order (Header -> Sections -> Footer).
 * - Show parent -> child nesting (rows -> columns -> elements).
 * - Keep visibility/lock toggles wired to node data.
 *
 * Important constraints and assumptions:
 * - Hierarchy is always derived from existing parent/ownership metadata.
 * - No drag-to-reorder or drag-to-reparent inside this panel.
 * - Hidden and locked states are stored in node data and toggled via updates.
 */

import { useMemo } from "react";
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

type LayerTreeItem =
  | {
      kind: "node";
      node: Node;
      children: LayerTreeItem[];
    }
  | {
      kind: "column";
      label: string;
      ownerId: string;
      columnIndex: number;
      children: LayerTreeItem[];
    };

// ================================
// Component
// ================================
export default function LayerPanel({
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeDelete,
  onReorderNodes: _onReorderNodes, // unused (read-only panel)
  onUpdateNode,
}: LayerPanelProps) {
  // Structural roots are the document anchors shown at the top level.
  const STRUCTURAL_TYPES = useMemo(
    () => new Set(["header", "section", "footer"]),
    []
  );

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
      case "row":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="4" rx="1" />
            <rect x="3" y="11" width="18" height="4" rx="1" />
            <rect x="3" y="17" width="18" height="2" rx="1" />
          </svg>
        );
      case "column":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <rect x="4" y="4" width="4" height="16" rx="1" />
            <rect x="10" y="4" width="4" height="16" rx="1" />
            <rect x="16" y="4" width="4" height="16" rx="1" />
          </svg>
        );
      case "header":
      case "footer":
        return (
          <svg {...iconStyle} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="4" rx="1" />
            <rect x="3" y="10" width="18" height="10" rx="2" />
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

  /**
   * Parent resolution:
   * - Prefer ReactFlow parentNode
   * - Fall back to column ownership keys when parentNode is missing
   * This keeps the hierarchy derived from existing relationships only.
   */
  const getParentId = (node: Node) => {
    const explicitParent = (node as any).parentNode;
    if (typeof explicitParent === "string" && explicitParent.length) return explicitParent;
    const ownedByColumn = (node.data as any)?._ownedByColumn;
    if (typeof ownedByColumn === "string" && ownedByColumn.length) return ownedByColumn;
    const rowOwner = (node.data as any)?._rowId;
    if (typeof rowOwner === "string" && rowOwner.length) return rowOwner;
    return null;
  };

  /**
   * Derive column count for any owner that exposes columns.
   */
  const getColumnCount = (node: Node) => {
    const columns = (node.data as any)?.columns;
    if (typeof columns === "number") return columns;
    if (typeof columns?.count === "number") return columns.count;
    return 0;
  };

  /**
   * Resolve column index for a child node; defaults to 0 when absent.
   */
  const getColumnIndex = (node: Node) => {
    const data: any = node.data ?? {};
    if (typeof data._columnIndex === "number") return data._columnIndex;
    if (typeof data.columnIndex === "number") return data.columnIndex;
    return 0;
  };

  /**
   * Compute ordering value to keep siblings stable:
   * 1) data.order (flow/rows)
   * 2) y position as fallback for absolute items
   */
  const getOrderValue = (node: Node) => {
    const dataOrder = (node.data as any)?.order;
    if (typeof dataOrder === "number") return dataOrder;
    const posY =
      (node.position as any)?.y ??
      (node.positionAbsolute as any)?.y ??
      0;
    return posY;
  };

  // Enforce document order: Header -> Sections -> Footer.
  const structuralComparator = (a: Node, b: Node) => {
    const rank = (node: Node) =>
      node.type === "header" ? 0 : node.type === "section" ? 1 : node.type === "footer" ? 2 : 3;
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return getOrderValue(a) - getOrderValue(b);
  };

  // Generic sibling ordering (per parent scope).
  const siblingComparator = (a: Node, b: Node) =>
    getOrderValue(a) - getOrderValue(b);

  // Children lookup table derived from parent relationships (single source of truth).
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Node[]>();
    nodes.forEach((node) => {
      const parentId = getParentId(node);
      const key = parentId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(node);
    });
    return map;
  }, [nodes]);

  // Build the tree once per render using the derived lookup.
  const layerTree = useMemo(() => {
    const visited = new Set<string>();

    const buildColumns = (owner: Node, children: Node[]): LayerTreeItem[] => {
      const count = Math.max(1, getColumnCount(owner));
      const grouped = new Map<number, Node[]>();
      children.forEach((child) => {
        const col = Math.min(Math.max(getColumnIndex(child), 0), count - 1);
        if (!grouped.has(col)) grouped.set(col, []);
        grouped.get(col)!.push(child);
      });

      return Array.from({ length: count }, (_v, idx) => {
        const columnChildren = (grouped.get(idx) ?? []).sort(siblingComparator);
        return {
          kind: "column" as const,
          label: `Column ${idx + 1}`,
          ownerId: owner.id,
          columnIndex: idx,
          children: columnChildren.map(buildNodeItem),
        };
      });
    };

    const buildChildren = (owner: Node): LayerTreeItem[] => {
      const direct =
        (childrenByParent.get(owner.id) ?? []).filter(
          (child) => !STRUCTURAL_TYPES.has(child.type || "")
        ) ?? [];

      const rows = direct.filter((n) => n.type === "row");
      const nonRows = direct.filter((n) => n.type !== "row");

      // Sections with rows keep row order; columns are owned by rows themselves.
      if (rows.length > 0) {
        return [...rows, ...nonRows].sort(siblingComparator).map(buildNodeItem);
      }

      // Column owners (section/header/footer/row without rows) render per-column grouping.
      if (getColumnCount(owner) > 0) {
        return buildColumns(owner, nonRows);
      }

      // Default: plain children list.
      return nonRows.sort(siblingComparator).map(buildNodeItem);
    };

    function buildNodeItem(node: Node): LayerTreeItem {
      if (visited.has(node.id)) {
        return { kind: "node", node, children: [] };
      }
      visited.add(node.id);
      return {
        kind: "node",
        node,
        children: buildChildren(node),
      };
    }

    // Roots are structural nodes ordered as Header -> Sections -> Footer.
    const structuralRoots = nodes
      .filter((n) => STRUCTURAL_TYPES.has(n.type || ""))
      .sort(structuralComparator)
      .map(buildNodeItem);

    // Orphans: nodes without structural parents stay visible at the bottom.
    const orphanRoots =
      (childrenByParent.get(null) ?? [])
        .filter((n) => !STRUCTURAL_TYPES.has(n.type || ""))
        .sort(siblingComparator)
        .map(buildNodeItem) ?? [];

    return [...structuralRoots, ...orphanRoots];
  }, [STRUCTURAL_TYPES, childrenByParent, nodes, siblingComparator, structuralComparator]);

  // ================================
  // Render helpers
  // ================================
  const renderLayerItem = (item: LayerTreeItem, depth = 0) => {
    const paddingLeft = 8 + depth * 12;

    if (item.kind === "column") {
      return (
        <div key={`${item.ownerId}-col-${item.columnIndex}`}>
          <div
            style={{
              padding: "4px 8px",
              paddingLeft,
              marginBottom: 2,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#6b7280",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              background: "transparent",
            }}
          >
            <span style={{ color: "#d1d5db", display: "flex" }}>
              {getNodeIcon("column")}
            </span>
            <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {item.label}
            </span>
          </div>
          {item.children.map((child) => renderLayerItem(child, depth + 1))}
        </div>
      );
    }

    const node = item.node;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id}>
        <div
          onClick={() => onNodeSelect(node)}
          className="layer-row"
          style={{
            padding: "6px 8px",
            paddingLeft,
            marginBottom: 1,
            borderRadius: 6,
            cursor: "pointer",
            backgroundColor: isSelected ? "#eff6ff" : "transparent",
            border: "none",
            borderLeft: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            transition: "background-color 0.15s ease, border-color 0.15s ease",
            minHeight: 32,
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = "#f9fafb";
            }
            const actions = e.currentTarget.querySelector(".layer-actions") as HTMLElement;
            if (actions) {
              actions.style.opacity = "1";
            }
            const deleteBtn = e.currentTarget.querySelector(".layer-delete") as HTMLElement;
            if (deleteBtn) {
              deleteBtn.style.opacity = "1";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
            const actions = e.currentTarget.querySelector(".layer-actions") as HTMLElement;
            if (actions && !isSelected) {
              actions.style.opacity = "0.6";
            }
            const deleteBtn = e.currentTarget.querySelector(".layer-delete") as HTMLElement;
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
                color: isSelected ? "#3b82f6" : "#9ca3af",
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
                  : isSelected
                  ? "#111827"
                  : "#4b5563",
                fontWeight: isSelected ? 500 : 400,
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
              opacity: isSelected ? 1 : 0.6,
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
        {item.children.map((child) => renderLayerItem(child, depth + 1))}
      </div>
    );
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
        {layerTree.map((item) => renderLayerItem(item))}
      </div>
    </div>
  );
}
