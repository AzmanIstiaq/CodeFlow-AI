/**
 * Column Drop Zones Hook
 *
 * Purpose:
 * - Track column drop regions and manage column ownership for dragged nodes.
 *
 * Role in the system:
 * - Enables column-aware placement within section and row layouts.
 *
 * Key responsibilities:
 * - Register column rectangles in flow coordinates.
 * - Detect drag overlap and resolve drop targets.
 * - Attach or detach nodes from column ownership metadata.
 * - Convert relative/absolute coordinates during detach operations.
 *
 * Important constraints and assumptions:
 * - Certain node types are disallowed in columns.
 * - Column rects must be refreshed when the viewport changes.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { useReactFlow } from "reactflow";
import { INVALID_COLUMN_CHILD_TYPES } from "../utils/nodeHelpers";

export function useColumnDropZones(
  nodes: any[],
  setNodes: (updater: any) => void
) {
  const reactFlow = useReactFlow();
  const { screenToFlowPosition } = reactFlow;

  // ================================
  // State and References
  // ================================
  // Incremented when viewport changes to trigger re-registration of column rects.
  const viewportVersionRef = useRef(0);

  // Cached column rectangles in flow coordinates: { sectionId: { columnIndex: DOMRect } }.
  const columnRectsRef = useRef<Record<string, Record<number, any>>>({});

  // Tracks the position where a drag started to distinguish click vs drag.
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Current hover state for visual feedback during drag.
  const [hoverState, setHoverState] = useState<{
    sectionId: string | null;
    columnIndex: number | null;
  }>({ sectionId: null, columnIndex: null });

  // ================================
  // Drag Stop Handling
  // ================================
  /**
   * Handles mouse release after dragging a node.
   * Decides whether to snap the node into a column or detach it from one.
   */
  const handleNodeDragStop = (event: any, node: any) => {
    if (!node || !node.id || !node.type || !node.position) return;

    // Distinguish between a click (no movement) and an actual drag.
    const wasDragged =
      dragStartPosRef.current &&
      node.position &&
      (Math.abs(node.position.x - dragStartPosRef.current.x) > 5 ||
        Math.abs(node.position.y - dragStartPosRef.current.y) > 5);

    // If hovering over a column, snap the node to it.
    if (hoverState.sectionId && hoverState.columnIndex !== null) {
      // Some node types cannot be placed in columns.
      if (INVALID_COLUMN_CHILD_TYPES.has(node.type)) {
        setHoverState({ sectionId: null, columnIndex: null });
        dragStartPosRef.current = null;
        return;
      }

      // Compute the drop point in flow coordinates.
      const clientX = event?.clientX;
      const clientY = event?.clientY;
      const dropPoint =
        typeof clientX === "number" && typeof clientY === "number"
          ? screenToFlowPosition({ x: clientX, y: clientY })
          : node.positionAbsolute
          ? { x: node.positionAbsolute.x, y: node.positionAbsolute.y }
          : node.position;
      addNodeToColumn(
        hoverState.sectionId,
        node.id,
        hoverState.columnIndex,
        dropPoint
      );
    } else if (node.data?._ownedByColumn && wasDragged) {
      // Node was dragged away from its column owner (don't move on click).
      removeNodeFromColumn(node.id);
    }

    // Clean up drag state.
    setHoverState({ sectionId: null, columnIndex: null });
    dragStartPosRef.current = null;
  };

  // ================================
  // Column Rectangle Registration
  // ================================
  /**
   * Registers a column's bounding rectangle in flow coordinates.
   * Called by column components when they render or update.
   *
   * Converts DOM coordinates (screen space) to flow coordinates
   * to match the coordinate system used by node positions.
   */
  const registerColumnRect = useCallback(
    (sectionId: string, colIndex: number, rect: DOMRect) => {
      // Convert DOM rect corners from screen space to flow space.
      const topLeft = screenToFlowPosition({
        x: rect.left,
        y: rect.top,
      });

      const bottomRight = screenToFlowPosition({
        x: rect.right,
        y: rect.bottom,
      });

      // Store column bounds in flow coordinates.
      if (!columnRectsRef.current[sectionId]) {
        columnRectsRef.current[sectionId] = {};
      }

      columnRectsRef.current[sectionId][colIndex] = {
        left: topLeft.x,
        top: topLeft.y,
        right: bottomRight.x,
        bottom: bottomRight.y,
      };
    },
    [screenToFlowPosition]
  );

  // ================================
  // Add Node to Column
  // ================================
  /**
   * Assigns a node to a column and marks it as owned by that column.
   *
   * Preserves the node's current position (ReactFlow drag operations
   * already positioned it correctly). Only updates ownership metadata.
   */
  const addNodeToColumn = (
    columnsSectionId: string,
    nodeId: string,
    columnIndex: number,
    dropPoint?: { x: number; y: number }
  ) => {
    const columnRect = columnRectsRef.current[columnsSectionId]?.[columnIndex];

    setNodes((nds: any[]) => {
      const ownerNode = nds.find((n) => n.id === columnsSectionId);
      const isRowOwner = ownerNode?.type === "row";
      const columnWidth = columnRect ? columnRect.right - columnRect.left : 0;
      const rowTop = columnRect ? columnRect.top : 0;

      return nds.map((node) => {
        // Handle the dropped node.
        if (node.id === nodeId) {
          // Verify node can be placed in columns.
          if (INVALID_COLUMN_CHILD_TYPES.has(node.type)) return node;

          // Keep the node's current relative position.
          let newPosition = node.position;

          return {
            ...node,
            position: newPosition,
            draggable: true,
            // Set parent if the owner is a row.
            ...(isRowOwner ? { parentNode: columnsSectionId } : {}),
            data: {
              ...node.data,
              _ownedByColumn: columnsSectionId,
              _columnIndex: columnIndex,
              // Metadata for row-owned nodes.
              ...(isRowOwner ? { _rowId: columnsSectionId } : {}),
              ...(isRowOwner && columnRect ? { _localY: newPosition.y } : {}),
              ...(isRowOwner ? { columnIndex } : {}),
            },
          };
        }

        // Update the column owner's children registry.
        if (
          (node.type === "section" || node.type === "row") &&
          node.data?.columns &&
          node.id === columnsSectionId
        ) {
          const children = { ...(node.data?.children ?? {}) };

          // Remove the node from all columns (prevents duplicates).
          Object.keys(children).forEach((k) => {
            children[k] = children[k].filter((id: string) => id !== nodeId);
          });

          // Add the node to the target column.
          children[columnIndex] = [...(children[columnIndex] ?? []), nodeId];

          return {
            ...node,
            data: {
              ...node.data,
              children,
            },
          };
        }

        return node;
      });
    });
  };

  // ================================
  // Remove Node from Column
  // ================================
  /**
   * Detaches a node from its column owner and converts position to absolute.
   */
  const removeNodeFromColumn = (nodeId: string) => {
    setNodes((nds: any[]) => {
      return nds.map((node) => {
        // Handle the detached node.
        if (node.id === nodeId) {
          const ownedBy = node.data?._ownedByColumn;

          // Remove all column-related metadata.
          const {
            _ownedByColumn,
            _columnIndex,
            columnIndex,
            _rowId,
            _localY,
            ...restData
          } = node.data || {};

          // Find the parent row and its parent section to compute absolute position.
          const parent = nds.find((n) => n.id === ownedBy);
          const section = parent?.parentNode
            ? nds.find((n) => n.id === parent.parentNode)
            : null;

          // Get positions for coordinate transformation
          const parentPosition = parent?.position ?? { x: 0, y: 0 };
          const sectionPosition = section?.position ?? { x: 0, y: 0 };

          // Calculate absolute position by accumulating parent transforms.
          const absolutePosition =
            node.parentNode === ownedBy
              ? {
                  // Sum relative position + all parent offsets
                  x:
                    (node.position?.x ?? 0) +
                    parentPosition.x +
                    sectionPosition.x,
                  y:
                    (node.position?.y ?? 0) +
                    parentPosition.y +
                    sectionPosition.y,
                }
              : node.position;

          return {
            ...node,
            draggable: true,
            // Remove parent reference to make node independent.
            parentNode:
              node.parentNode === ownedBy ? undefined : node.parentNode,
            // Use absolute position so node stays visually in the same place
            position: absolutePosition,
            data: restData,
          };
        }

        // Update the owner's children registry to remove the detached node.
        if (
          (node.type === "section" || node.type === "row") &&
          node.data?.columns
        ) {
          const children = { ...(node.data?.children ?? {}) };

          // Remove from all columns.
          Object.keys(children).forEach((k) => {
            children[k] = children[k].filter((id: string) => id !== nodeId);
          });

          return {
            ...node,
            data: {
              ...node.data,
              children,
            },
          };
        }

        return node;
      });
    });

    // Force ReactFlow to recalculate internal node state after parent changes.
    requestAnimationFrame(() => (reactFlow as any).updateNodeInternals(nodeId));
  };

  // ================================
  // Drag Handling and Hover Detection
  // ================================
  /**
   * Called continuously during node drag to update hover state.
   */
  const handleNodeDrag = (node: any) => {
    // Record initial position on first drag event.
    if (!dragStartPosRef.current) {
      dragStartPosRef.current = { x: node.position.x, y: node.position.y };
    }

    // Validate node has required properties for overlap detection.
    if (!node || !node.id || !node.type) return;
    if (INVALID_COLUMN_CHILD_TYPES.has(node.type)) return;
    if (!node.positionAbsolute || !node.width || !node.height) return;

    // Build the node's bounding box in absolute coordinates.
    const nodeRect = {
      left: node.positionAbsolute.x,
      right: node.positionAbsolute.x + node.width,
      top: node.positionAbsolute.y,
      bottom: node.positionAbsolute.y + node.height,
    };

    // Search for the column that overlaps with the node.
    let targetSection: string | null = null;
    let targetColIndex: number | null = null;

    // Iterate through registered columns to find overlap
    for (const [sectionId, columns] of Object.entries(columnRectsRef.current)) {
      for (const [colIndex, rect] of Object.entries(columns)) {
        // Check for AABB overlap.
        const overlaps =
          nodeRect.right > rect.left &&
          nodeRect.left < rect.right &&
          nodeRect.bottom > rect.top &&
          nodeRect.top < rect.bottom;

        if (overlaps) {
          targetSection = sectionId;
          targetColIndex = Number(colIndex);
          break;
        }
      }
      if (targetSection) break;
    }

    // Update hover state only if target changed.
    if (
      targetSection !== hoverState.sectionId ||
      targetColIndex !== hoverState.columnIndex
    ) {
      setHoverState({
        sectionId: targetSection,
        columnIndex: targetColIndex,
      });
    }
  };

  // ================================
  // Find Drop Target
  // ================================
  /**
   * Given a point in flow coordinates, finds which column contains it.
   * Used during node placement (e.g., when clicking to place from toolbar).
   */
  const findDropTarget = useCallback((point: { x: number; y: number }) => {
    for (const [sectionId, columns] of Object.entries(columnRectsRef.current)) {
      for (const [colIndex, rect] of Object.entries(columns)) {
        // Point-in-rectangle test.
        const inside =
          point.x >= rect.left &&
          point.x <= rect.right &&
          point.y >= rect.top &&
          point.y <= rect.bottom;

        if (inside) {
          return {
            ownerId: sectionId,
            columnIndex: Number(colIndex),
            rect,
          };
        }
      }
    }
    return null;
  }, []);

  // ================================
  // Viewport / Column Rect Updates
  // ================================
  /**
   * Invalidate cached column rectangles when the viewport changes.
   */
  const handleMoveEnd = () => {
    viewportVersionRef.current += 1;
    columnRectsRef.current = {};
  };

  /**
   * Re-register column rectangles when nodes or viewport change.
   */
  useEffect(() => {
    nodes.forEach((node: any) => {
      // Only section and row nodes have columns.
      if (
        (node.type === "section" || node.type === "row") &&
        node.data?.columns
      ) {
        const columnCount = node.data.columns.count || node.data.columns;

        // Register each column's DOM bounding rect
        for (let i = 0; i < columnCount; i++) {
          const el = document.getElementById(`column-${node.id}-${i}`);
          if (el) {
            registerColumnRect(node.id, i, el.getBoundingClientRect());
          }
        }
      }
    });
  }, [nodes, viewportVersionRef.current, registerColumnRect]);

  // ================================
  // Return Public API
  // ================================
  return {
    registerColumnRect,
    addNodeToColumn,
    removeNodeFromColumn,
    handleMoveEnd,
    handleNodeDrag,
    handleNodeDragStop,
    viewportVersion: viewportVersionRef.current,
    hoverState,
    findDropTarget,
  };
}
