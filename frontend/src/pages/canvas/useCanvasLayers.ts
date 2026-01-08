/**
 * useCanvasLayers Hook
 *
 * Manages visual layer ordering and visibility of nodes on the canvas.
 * Provides layering (z-index), lock/hide, and zoom controls.
 *
 * Features:
 * 1. LAYERING: Control stacking order of overlapping nodes (bring to front/back)
 * 2. LOCKING: Prevent accidental movement of important nodes
 * 3. VISIBILITY: Hide nodes from view (remains in data, not rendered)
 * 4. ZOOM: Reset zoom to 100% (1x) to see full canvas
 *
 * Z-Index:
 * - Stored in node.zIndex property (numeric)
 * - Higher values appear above lower values
 * - Default (undefined) treated as 0
 * - "Bring to Front": Set to max(all zIndex) + 1
 * - "Send to Back": Set to 0
 * - "Bring Forward": Increment by 1
 * - "Send Backward": Decrement by 1 (minimum 0)
 *
 * Visibility:
 * - locked: boolean flag in node.data - prevents dragging
 * - hidden: boolean flag in node.data - hides from canvas but keeps in data
 * - Hidden nodes automatically deselected (can't interact while hidden)
 *
 * Used by:
 * - Layers panel (right sidebar showing all nodes)
 * - Context menu on selected nodes
 * - Keyboard shortcuts (Ctrl+Shift+Up/Down for z-index)
 */

import type { Node as ReactFlowNode } from "reactflow";
import type { ReactFlowInstance } from "reactflow";

interface UseCanvasLayersProps {
  selectedNodes: ReactFlowNode[];
  selectedNode: ReactFlowNode | null;
  setNodes: (updater: any) => void;
  setSelectedNode: (node: ReactFlowNode | null) => void;
  setSelectedNodes: (nodes: ReactFlowNode[]) => void;
  reactFlowInstance: ReactFlowInstance;
}

export function useCanvasLayers({
  selectedNodes,
  selectedNode,
  setNodes,
  setSelectedNode,
  setSelectedNodes,
  reactFlowInstance,
}: UseCanvasLayersProps) {
  // =====================================
  // LOCK/HIDE OPERATIONS
  // =====================================
  /**
   * Lock selected nodes to prevent accidental movement
   * Sets draggable=false and locked=true flag on node
   * Locked nodes can still be selected and other properties edited
   */
  const handleLock = () => {
    const nodesToLock =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToLock.length === 0) return;

    setNodes((nds: any) =>
      nds.map((n: any) =>
        nodesToLock.some((sn) => sn.id === n.id)
          ? { ...n, data: { ...n.data, locked: true }, draggable: false }
          : n
      )
    );
  };

  /**
   * Hide selected nodes from canvas view
   * Sets hidden=true flag, node remains in data but not rendered
   * Automatically deselects hidden nodes (cannot interact with hidden elements)
   */
  const handleHide = () => {
    const nodesToHide =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToHide.length === 0) return;

    setNodes((nds: any) =>
      nds.map((n: any) =>
        nodesToHide.some((sn) => sn.id === n.id)
          ? { ...n, data: { ...n.data, hidden: true } }
          : n
      )
    );
    // Clear selection since hidden nodes cannot be interacted with
    setSelectedNode(null);
    setSelectedNodes([]);
  };

  // =====================================
  // Z-INDEX (LAYERING) OPERATIONS
  // =====================================
  /**
   * Bring selected nodes to very front
   * Sets z-index to maximum + 1 to guarantee top position
   */
  const handleBringToFront = () => {
    const nodesToMove =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToMove.length === 0) return;

    setNodes((nds: any) => {
      // Find current maximum z-index on canvas
      const maxZIndex = Math.max(...nds.map((n: any) => n.zIndex || 0));
      return nds.map((n: any) =>
        nodesToMove.some((sn) => sn.id === n.id)
          ? { ...n, zIndex: maxZIndex + 1 }
          : n
      );
    });
  };

  /**
   * Move selected nodes one layer up
   * Increments z-index by 1
   * Useful for fine-tuning stacking without jumping to top
   */
  const handleBringForward = () => {
    const nodesToMove =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToMove.length === 0) return;

    setNodes((nds: any) => {
      return nds.map((n: any) =>
        nodesToMove.some((sn) => sn.id === n.id)
          ? { ...n, zIndex: (n.zIndex || 0) + 1 }
          : n
      );
    });
  };

  /**
   * Move selected nodes one layer down
   * Decrements z-index by 1
   * Minimum value is 0 (cannot go negative)
   */
  const handleSendBackward = () => {
    const nodesToMove =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToMove.length === 0) return;

    setNodes((nds: any) => {
      return nds.map((n: any) =>
        nodesToMove.some((sn) => sn.id === n.id)
          ? { ...n, zIndex: Math.max(0, (n.zIndex || 0) - 1) }
          : n
      );
    });
  };

  /**
   * Send selected nodes to very back
   * Sets z-index to 0 (minimum)
   */
  const handleSendToBack = () => {
    const nodesToMove =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
        ? [selectedNode]
        : [];
    if (nodesToMove.length === 0) return;

    setNodes((nds: any) => {
      return nds.map((n: any) =>
        nodesToMove.some((sn) => sn.id === n.id) ? { ...n, zIndex: 0 } : n
      );
    });
  };

  // =====================================
  // VIEW MANAGEMENT
  // =====================================
  /**
   * Reset zoom and pan to default (1x zoom at origin)
   * Useful when user zooms/pans too much and wants to reset view
   * Sets viewport x=0, y=0, zoom=1
   */
  const handleZoomTo100 = () => {
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
  };

  return {
    handleLock,
    handleHide,
    handleBringToFront,
    handleBringForward,
    handleSendBackward,
    handleSendToBack,
    handleZoomTo100,
  };
}
