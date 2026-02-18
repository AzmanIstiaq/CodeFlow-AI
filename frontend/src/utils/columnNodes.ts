/**
 * Column Node Utilities
 *
 * Creates and manages column nodes as separate entities that can have their own spacing properties.
 * Each column is a standalone node that can be selected and configured independently.
 *
 * New dev note:
 * These helpers are the single place we materialize columns as real React Flow nodes.
 * Column nodes carry spacing/alignment overrides and never render visual content themselves.
 * They are always flow-positioned, owned by a layout container (section/row/header/footer),
 * and must stay in sync with the owner's column count.
 */

import type { Node } from "reactflow";

export interface ColumnNode extends Node {
  type: "column";
  data: {
    _ownedByColumn: string; // ID of the layout owner (section/row/header/footer)
    _columnIndex: number;   // Stable 0-based index inside the owner
    gap?: number;           // Optional column-level gap override
    padding?: number;       // Optional column-level padding override
    justifyContent?: string; // Column main-axis alignment (maps to FlowSpacing "Main Axis")
    alignItems?: string;    // Column cross-axis alignment (maps to FlowSpacing "Cross Axis")
    positionMode: "flow";   // Columns are always flow-positioned
    [key: string]: any;
  };
}

/**
 * Generate column nodes for a container
 */
export function generateColumnNodes(
  containerId: string,
  columnCount: number,
  existingNodes: Node[] = []
): ColumnNode[] {
  // Ensure we return one ColumnNode per index; reuse existing nodes to preserve user edits.
  const columns: ColumnNode[] = [];
  
  for (let i = 0; i < columnCount; i++) {
    // Check if column node already exists
    const existingColumn = existingNodes.find(
      (node) => 
        node.type === "column" && 
        node.data?._ownedByColumn === containerId && 
        node.data?._columnIndex === i
    );
    
    if (existingColumn) {
      columns.push(existingColumn as ColumnNode);
      continue;
    }
    
    // Create new column node
    // NOTE: Column nodes themselves are invisible containers; they are selectable but not draggable.
    const columnNode: ColumnNode = {
      id: `${containerId}-column-${i}`,
      type: "column",
      position: { x: 0, y: 0 },
      data: {
        _ownedByColumn: containerId,
        _columnIndex: i,
        positionMode: "flow",
        label: `Column ${i + 1}`,
      },
      draggable: false, // Columns shouldn't be draggable
      selectable: true, // But they should be selectable
    };
    
    columns.push(columnNode);
  }
  
  return columns;
}

/**
 * Update column ownership for existing nodes
 *
 * When a container changes its column count, children keep their column index if possible;
 * otherwise they are clamped to the highest valid index.
 */
export function updateColumnOwnership(
  nodes: Node[],
  containerId: string,
  columnCount: number
): Node[] {
  return nodes.map((node) => {
    // Skip column nodes themselves
    if (node.type === "column") return node;
    
    // Only update nodes owned by this container
    if (node.data?._ownedByColumn !== containerId) return node;
    
    // Clamp column index to new count
    const currentColumnIndex = node.data?._columnIndex ?? 0;
    const newColumnIndex = Math.min(currentColumnIndex, columnCount - 1);
    
    return {
      ...node,
      data: {
        ...node.data,
        _columnIndex: newColumnIndex,
      },
    };
  });
}

/**
 * Remove excess column nodes when column count is reduced
 *
 * Filters out column nodes whose index is now out of range.
 */
export function removeExcessColumns(
  nodes: Node[],
  containerId: string,
  columnCount: number
): Node[] {
  return nodes.filter((node) => {
    if (node.type !== "column") return true;
    if (node.data?._ownedByColumn !== containerId) return true;
    if (node.data?._columnIndex < columnCount) return true;
    
    return false; // Remove excess column
  });
}
