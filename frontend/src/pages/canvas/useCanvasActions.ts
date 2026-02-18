/**
 * useCanvasActions Hook
 *
 * Provides canvas manipulation operations (alignment, distribution, copy/paste, selection).
 * These are the core editing operations available via keyboard shortcuts and toolbar buttons.
 *
 * Operations:
 * 1. ALIGNMENT: Snap multiple selected nodes to edge or center
 * 2. DISTRIBUTION: Evenly space 3+ selected nodes with consistent gaps
 * 3. DUPLICATION: Clone selected nodes offset by 20px
 * 4. DELETION: Remove selected nodes (preserves section/row containers)
 * 5. COPY/PASTE/CUT: Clipboard operations with offset placement
 * 6. SELECTION: Select all nodes or deselect
 * 7. COLUMN MANAGEMENT: Adjust section column configuration
 *
 * Features:
 * - Section and row nodes are protected (cannot be deleted/copied except in special contexts)
 * - Clipboard operations offset pasted nodes to prevent overlap
 * - Alignment/distribution work on multiple selected nodes
 * - Unique IDs generated using timestamp + random string to prevent collisions
 *
 * Used by:
 * - Keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Delete)
 * - Alignment toolbar buttons (left, right, center-h, top, bottom, center-v)
 * - Distribution buttons (horizontal, vertical)
 * - Canvas context menu and toolbar
 */

import type { Node as ReactFlowNode } from "reactflow";

interface UseCanvasActionsProps {
  selectedNodes: ReactFlowNode[];
  selectedNode: ReactFlowNode | null;
  setNodes: (updater: any) => void;
  setSelectedNode: (node: ReactFlowNode | null) => void;
  setSelectedNodes: (nodes: ReactFlowNode[]) => void;
  clipboard: any[];
  setClipboard: (nodes: any[]) => void;
  nodes: any[];
}

export function useCanvasActions({
  selectedNodes,
  selectedNode,
  setNodes,
  setSelectedNode,
  setSelectedNodes,
  clipboard,
  setClipboard,
  nodes,
}: UseCanvasActionsProps) {
  // Hook contract: returns stable action handlers used by toolbar + keyboard shortcuts.
  // Behavioral rules (protected node types, offsets, selection semantics) are enforced here.
  // =====================================
  // ALIGNMENT & DISTRIBUTION
  // =====================================
  /**
   * Align selected nodes to a common edge or center
   * Requires 2+ selected nodes
   *
   * Types:
   * - "left": Snap to leftmost node's X position
   * - "right": Snap to rightmost node's X position
   * - "center-h": Align to average X position (horizontal center)
   * - "top": Snap to topmost node's Y position
   * - "bottom": Snap to bottommost node's Y position
   * - "center-v": Align to average Y position (vertical center)
   */
  // Alignment and distribution handlers
  const handleAlign = (type: string) => {
    if (selectedNodes.length < 2) return;

    const positions = selectedNodes.map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
    }));
    let newX: number, newY: number;

    switch (type) {
      case "left":
        // Snap all nodes to leftmost position
        newX = Math.min(...positions.map((p) => p.x));
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find((sn) => sn.id === n.id)
              ? { ...n, position: { ...n.position, x: newX } }
              : n
          )
        );
        break;
      case "right":
        // Snap all nodes to rightmost position
        newX = Math.max(...positions.map((p) => p.x));
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find((sn) => sn.id === n.id)
              ? { ...n, position: { ...n.position, x: newX } }
              : n
          )
        );
        break;
      case "center-h":
        // Align all nodes to average X position
        const avgX =
          positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find((sn) => sn.id === n.id)
              ? { ...n, position: { ...n.position, x: avgX } }
              : n
          )
        );
        break;
      case "top":
        // Snap all nodes to topmost position
        newY = Math.min(...positions.map((p) => p.y));
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find((sn) => sn.id === n.id)
              ? { ...n, position: { ...n.position, y: newY } }
              : n
          )
        );
        break;
      case "bottom":
        // Snap all nodes to bottommost position
        newY = Math.max(...positions.map((p) => p.y));
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find((sn) => sn.id === n.id)
              ? { ...n, position: { ...n.position, y: newY } }
              : n
          )
        );
        break;
      case "center-v":
        // Align all nodes to average Y position
        const avgY =
          positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find((sn) => sn.id === n.id)
              ? { ...n, position: { ...n.position, y: avgY } }
              : n
          )
        );
        break;
    }
  };

  /**
   * Distribute selected nodes evenly across available space
   * Requires 3+ selected nodes
   * Keeps first and last nodes fixed, distributes rest equally between them
   *
   * Process:
   * 1. Sort nodes by position (horizontal or vertical)
   * 2. Calculate total distance from first to last node
   * 3. Divide by (count - 1) to find equal gaps
   * 4. Place middle nodes at calculated intervals
   */
  const handleDistribute = (type: string) => {
    if (selectedNodes.length < 3) return;

    // Sort nodes by their position along distribution axis
    const sorted = [...selectedNodes].sort((a, b) =>
      type === "horizontal"
        ? a.position.x - b.position.x
        : a.position.y - b.position.y
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    // Calculate total space and gap between nodes
    const totalSpace =
      type === "horizontal"
        ? last.position.x - first.position.x
        : last.position.y - first.position.y;
    const gap = totalSpace / (sorted.length - 1);

    setNodes((nds: any) =>
      nds.map((n: any) => {
        const index = sorted.findIndex((sn) => sn.id === n.id);
        // Skip first and last nodes, they stay in place
        if (index === -1 || index === 0 || index === sorted.length - 1)
          return n;

        // Place middle nodes at evenly spaced intervals
        return {
          ...n,
          position:
            type === "horizontal"
              ? { ...n.position, x: first.position.x + gap * index }
              : { ...n.position, y: first.position.y + gap * index },
        };
      })
    );
  };

  // =====================================
  // NODE DUPLICATION
  // =====================================
  /**
   * Clone selected nodes with offset positioning
   * Generates unique IDs to prevent collisions
   * Skips section and row containers (structure is protected)
   */
  const handleDuplicate = () => {
    const nodesToDuplicate =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToDuplicate.length === 0) return;

    // Filter out structural nodes
    const filtered = nodesToDuplicate.filter(
      (node: any) => node.type !== "section" && node.type !== "row"
    );
    if (filtered.length === 0) return;

    // Clone with new ID and offset position to avoid overlap
    const newNodes = filtered.map((node: any) => ({
      ...node,
      id: `${node.type}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: false,
    }));

    setNodes((nds: any) => [...nds, ...newNodes]);
  };

  // =====================================
  // NODE DELETION
  // =====================================
  /**
   * Delete selected nodes
   * Protected nodes (section, row) cannot be deleted to preserve page structure
   */
  const handleDelete = () => {
    const nodesToDelete =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToDelete.length === 0) return;

    // Filter out structural nodes
    const filtered = nodesToDelete.filter(
      (node: any) => node.type !== "section" && node.type !== "row"
    );
    if (filtered.length === 0) return;

    const idsToDelete = filtered.map((n) => n.id);
    setNodes((nds: any) => nds.filter((n: any) => !idsToDelete.includes(n.id)));
    setSelectedNode(null);
    setSelectedNodes([]);
  };

  // =====================================
  // CLIPBOARD OPERATIONS
  // =====================================
  /**
   * Copy selected nodes to clipboard
   * Does not remove from canvas (duplicate on paste)
   * Skips section and row containers
   */
  const handleCopy = () => {
    const nodesToCopy =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToCopy.length === 0) return;
    const filtered = nodesToCopy.filter(
      (node: any) => node.type !== "section" && node.type !== "row"
    );
    if (filtered.length === 0) return;
    setClipboard(filtered);
  };

  /**
   * Paste clipboard nodes with offset positioning
   * Creates new nodes from clipboard with incremented IDs and offset positions
   * Prevents overlap with original clipboard contents
   */
  const handlePaste = () => {
    const pasteable = clipboard.filter(
      (node: any) => node.type !== "section" && node.type !== "row"
    );
    if (pasteable.length === 0) return;

    const newNodes = pasteable.map((node: any) => ({
      ...node,
      id: `${node.type}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
    }));

    setNodes((nds: any) => [...nds, ...newNodes]);
  };

  /**
   * Cut = Copy + Delete
   * Copies nodes to clipboard then removes them from canvas
   * Skips section and row containers
   */
  const handleCut = () => {
    const nodesToCut =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToCut.length === 0) return;
    const filtered = nodesToCut.filter(
      (node: any) => node.type !== "section" && node.type !== "row"
    );
    if (filtered.length === 0) return;
    setClipboard(filtered);
    setNodes((nds: any) =>
      nds.filter((n: any) => !filtered.some((f: any) => f.id === n.id))
    );
    setSelectedNode(null);
    setSelectedNodes([]);
  };

  // =====================================
  // SELECTION MANAGEMENT
  // =====================================
  /**
   * Select all selectable nodes
   * Excludes section and row containers (structural elements)
   */
  const handleSelectAll = () => {
    const selectableNodes = nodes.filter(
      (n: any) => n.type !== "section" && n.type !== "row"
    );
    setSelectedNodes(selectableNodes);
  };

  /**
   * Clear all selections
   */
  const handleDeselect = () => {
    setSelectedNode(null);
    setSelectedNodes([]);
  };

  // =====================================
  // SECTION COLUMN MANAGEMENT
  // =====================================
  /**
   * Configure column layout for a section node
   * Updates section's data.columns property with new count
   * Requires exactly one section node to be selected
   */
  const handleSetColumns = (count: number) => {
    if (selectedNodes.length === 1 && selectedNodes[0].type === "section") {
      const sectionId = selectedNodes[0].id;
      setNodes((nds: any) =>
        nds.map((n: any) =>
          n.id === sectionId
            ? {
                ...n,
                data: {
                  ...n.data,
                  columns: {
                    count,
                    gap: n.data.columns?.gap || 24,
                  },
                },
              }
            : n
        )
      );
    }
  };

  return {
    handleAlign,
    handleDistribute,
    handleDuplicate,
    handleDelete,
    handleCopy,
    handlePaste,
    handleSelectAll,
    handleDeselect,
    handleSetColumns,
    handleCut,
  };
}