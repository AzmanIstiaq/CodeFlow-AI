import type { Node, Edge } from "reactflow";

export interface TreeNode extends Node {
  children: TreeNode[];
}

/**
 * Converts a flat list of nodes and edges into a hierarchical tree structure.
 * Edges represent parent-child relationships: source is parent, target is child.
 *
 * @param nodes - Array of React Flow nodes
 * @param edges - Array of React Flow edges
 * @returns Array of root nodes (nodes with no parent) with nested children
 */
export function buildTree(nodes: Node[], edges: Edge[]): TreeNode[] {
  const map = new Map<string, TreeNode>();

  // Initialize all nodes with empty children arrays
  nodes.forEach((n) => {
    map.set(n.id, { ...n, children: [] });
  });

  // Build parent-child relationships
  edges.forEach((e) => {
    const parent = map.get(e.source);
    const child = map.get(e.target);
    if (parent && child) {
      parent.children.push(child);
    }
  });

  // Return only root nodes (nodes that are not children of any other node)
  return Array.from(map.values()).filter(
    (n) => !edges.some((e) => e.target === n.id)
  );
}
