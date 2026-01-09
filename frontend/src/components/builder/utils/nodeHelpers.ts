/**
 * Node Helper Utilities
 *
 * Purpose:
 * - Provide shared helpers for node metadata and ordering.
 *
 * Role in the system:
 * - Centralize small utilities used across builder hooks.
 *
 * Key responsibilities:
 * - Define invalid column child types.
 * - Generate IDs for new nodes.
 * - Normalize ordering metadata for sections or scoped children.
 *
 * Important constraints and assumptions:
 * - normalizeOrder mutates node data order in place for consistency.
 */

export const INVALID_COLUMN_CHILD_TYPES = new Set<string>([
  "section",
  "row",
  "columnsSection",
  "start",
  "ai",
  "output",
]);

// ================================
// ID Generation
// ================================
/**
 * Generate a short, pseudo-random ID with a prefix.
 */
export const generateId = (prefix: string): string => {
  return prefix + "_" + Math.random().toString(36).substring(2, 9);
};

// ================================
// Ordering
// ================================
/**
 * Normalize data.order for sections or nodes scoped under a parent edge.
 */
export const normalizeOrder = (
  nodeList: any[],
  edgeList: any[],
  parentId?: string
) => {
  const scoped = parentId
    ? nodeList.filter((n) =>
        edgeList.some((e) => e.source === parentId && e.target === n.id)
      )
    : nodeList.filter((n) => n.type === "section");

  scoped
    .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
    .forEach((n, index) => {
      n.data.order = index;
    });

  return nodeList;
};
