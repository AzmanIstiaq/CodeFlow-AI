/**
 * RULE BOUNDARY
 *
 * This file must not define layout, spacing, drag, resize,
 * selection, or z-index rules.
 *
 * All such logic MUST come from frontendRules/*.
 */
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
import {
  deriveColumnMetrics,
  deriveNodeHeight,
  deriveNodeSize,
  computeInsertForFlow,
  applyFlowPlacement,
  locateColumnAtPoint,
} from "../../../frontendRules/flow/flowResolvers";
import { isColumnDropAllowed } from "../../../frontendRules/flow/flowPolicy";
import { DRAG_MOVE_THRESHOLD } from "../../../frontendRules/interaction/interactionMetrics";

export function useColumnDropZones(
  nodes: any[],
  setNodes: (updater: any) => void
) {
  const reactFlow = useReactFlow();
  const { screenToFlowPosition } = reactFlow;


  const toFlowPoint = (event?: any) => {
    const clientX = event?.clientX;
    const clientY = event?.clientY;
    if (typeof clientX === "number" && typeof clientY === "number") {
      return screenToFlowPosition({ x: clientX, y: clientY });
    }
    return null;
  };

  const getNodeAbsolutePosition = (
    nodeId: string | undefined,
    nodeList: any[]
  ) => {
    if (!nodeId) return { x: 0, y: 0 };
    let accX = 0;
    let accY = 0;
    let current = nodeList.find((n) => n.id === nodeId);
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      accX += current.position?.x ?? 0;
      accY += current.position?.y ?? 0;
      if (!current.parentNode) break;
      current = nodeList.find((n) => n.id === current!.parentNode);
    }
    return { x: accX, y: accY };
  };


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

  const [flowReorderState, setFlowReorderState] = useState<{
    ownerId: string;
    columnIndex: number;
    targetIndex: number;
    nodeId: string;
  } | null>(null);

  // ================================
  // Drag Stop Handling
  // ================================
  /**
   * Handles mouse release after dragging a node.
   * Decides whether to snap the node into a column or detach it from one.
   */
  const handleNodeDragStop = (event: any, node: any) => {
    if (!node || !node.id || !node.type) return;

    const flowPoint = toFlowPoint(event);
    if (!flowPoint) {
      setHoverState({ sectionId: null, columnIndex: null });
      dragStartPosRef.current = null;
      return;
    }
    const { width, height } = deriveNodeSize(node);
    const dropPoint = {
      x: flowPoint.x - width / 2,
      y: flowPoint.y - height / 2,
    };

    // Distinguish between a click (no movement) and an actual drag.
    const wasDragged =
      dragStartPosRef.current &&
      (Math.abs(dropPoint.x - dragStartPosRef.current.x) > DRAG_MOVE_THRESHOLD ||
        Math.abs(dropPoint.y - dragStartPosRef.current.y) > DRAG_MOVE_THRESHOLD);

    const target = locateColumnAtPoint(columnRectsRef.current, flowPoint);

    if (node.data?.positionMode === "flow") {
      if (target) {
        setNodes((nds: any[]) => {
          const { insertIndex } = computeInsertForFlow(
            nds,
            target.ownerId,
            target.columnIndex,
            node.id,
            flowPoint?.y,
            columnRectsRef.current
          );
          return applyFlowPlacement(
            nds,
            target.ownerId,
            target.columnIndex,
            node.id,
            insertIndex
          );
        });
      } else if (node.data?._ownedByColumn && wasDragged) {
        removeNodeFromColumn(node.id, dropPoint ?? undefined);
      }

      setFlowReorderState(null);
      setHoverState({ sectionId: null, columnIndex: null });
      dragStartPosRef.current = null;
      return;
    }

    // If hovering over a column with an absolute node, snap the node to it.
    if (target) {
      if (!isColumnDropAllowed(node.type)) {
        setHoverState({ sectionId: null, columnIndex: null });
        dragStartPosRef.current = null;
        return;
      }

      addNodeToColumn(
        target.ownerId,
        node.id,
        target.columnIndex,
        dropPoint ?? undefined,
        target.rect
      );
    } else if (node.data?._ownedByColumn && wasDragged) {
      // Node was dragged away from its column owner (don't move on click).
      removeNodeFromColumn(node.id, dropPoint ?? undefined);
    } else {
      // Absolute free placement: set position relative to parent (if any).
      setNodes((nds: any[]) => {
        const parentAbs = getNodeAbsolutePosition(node.parentNode, nds);
        return nds.map((n) => {
          if (n.id !== node.id) return n;
          return {
            ...n,
            data: {
              ...n.data,
              _ownedByColumn: undefined,
              _columnIndex: undefined,
              _rowId: undefined,
            },
            position: {
              x: dropPoint.x - parentAbs.x,
              y: dropPoint.y - parentAbs.y,
            },
            draggable: true,
          };
        });
      });
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
    position?: { x: number; y: number },
    rectOverride?: { left: number; top: number; right?: number; bottom?: number }
  ) => {
    setNodes((nds: any[]) => {
      const dragged = nds.find((n) => n.id === nodeId);
      if (!dragged) return nds;

      const ownerNode = nds.find((n) => n.id === columnsSectionId);
      const columnRect =
        rectOverride ??
        columnRectsRef.current[columnsSectionId]?.[columnIndex];
      if (!columnRect) return nds;

      const isFlow = dragged.data?.positionMode === "flow";

      if (isFlow) {
        // OWNERSHIP: _ownedByColumn/_columnIndex are assigned only through flowResolvers.applyFlowPlacement.
        const { insertIndex } = computeInsertForFlow(
          nds,
          columnsSectionId,
          columnIndex,
          nodeId,
          position?.y,
          columnRectsRef.current
        );
        return applyFlowPlacement(
          nds,
          columnsSectionId,
          columnIndex,
          nodeId,
          insertIndex
        );
      }

      const parentAbs = getNodeAbsolutePosition(columnsSectionId, nds);
      const absDrop =
        position ??
        (dragged.positionAbsolute
          ? { x: dragged.positionAbsolute.x, y: dragged.positionAbsolute.y }
          : dragged.positionAbsolute ?? dragged.position);
      if (!absDrop) return nds;
      const newPosition = {
        x: absDrop.x - parentAbs.x,
        y: absDrop.y - columnRect.top,
      };

      return nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            parentNode: columnsSectionId,
            extent: "parent",
            draggable: node.draggable !== false,
            position: newPosition,
            data: {
              ...node.data,
              _ownedByColumn: columnsSectionId,
              _columnIndex: columnIndex,
              ...(ownerNode?.type === "row"
                ? { _rowId: columnsSectionId, columnIndex }
                : { columnIndex }),
            },
          };
        }

        if (node.type === "section" || node.type === "row") {
          if (!node.data?.columns) return node;
          const children = { ...(node.data?.children ?? {}) };
          Object.keys(children).forEach((k) => {
            children[k] = children[k].filter((id: string) => id !== nodeId);
          });

          if (node.id === columnsSectionId) {
            const numKey = Number.isInteger(columnIndex)
              ? columnIndex
              : parseInt(String(columnIndex), 10);
            const strKey = String(numKey);
            children[numKey] = [...(children[numKey] ?? []), nodeId];
            children[strKey] = [...(children[strKey] ?? []), nodeId];
          }

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
  const removeNodeFromColumn = (
    nodeId: string,
    absoluteHint?: { x?: number; y?: number }
  ) => {
    setNodes((nds: any[]) => {
      return nds.map((node) => {
        // Handle the detached node.
        if (node.id === nodeId) {
          const ownedBy = node.data?._ownedByColumn;
          const ownedColumnIndex = node.data?._columnIndex;
          const ownerNode = ownedBy
            ? nds.find((n) => n.id === ownedBy)
            : null;
          const { gap: columnGap, paddingY: columnPaddingY } =
            deriveColumnMetrics(ownerNode);
          const columnRect =
            ownedBy !== undefined && ownedColumnIndex !== undefined
              ? columnRectsRef.current[ownedBy]?.[ownedColumnIndex]
              : undefined;

          const siblings =
            ownedBy !== undefined && ownedColumnIndex !== undefined
              ? nds
                  .filter(
                    (n) =>
                      n.data?._ownedByColumn === ownedBy &&
                      n.data?._columnIndex === ownedColumnIndex
                  )
                  .sort((a, b) => (a.data?.order ?? 0) - (b.data?.order ?? 0))
              : [];

          // Remove all column-related metadata.
          const {
            _ownedByColumn,
            _columnIndex,
            columnIndex: _removedColumnIndex,
            _rowId,
            _localY,
            ...restData
          } = node.data || {};

          let absolutePosition: { x: number; y: number } | undefined;

          if (
            absoluteHint &&
            typeof absoluteHint.x === "number" &&
            typeof absoluteHint.y === "number"
          ) {
            absolutePosition = { x: absoluteHint.x, y: absoluteHint.y };
          } else if (node.positionAbsolute) {
            absolutePosition = {
              x: node.positionAbsolute.x,
              y: node.positionAbsolute.y,
            };
          } else if (columnRect) {
            let cursorY = columnRect.top + columnPaddingY;
            for (let i = 0; i < siblings.length; i++) {
              const sib = siblings[i];
              if (sib.id === node.id) break;
              cursorY += deriveNodeHeight(sib) + columnGap;
            }
            absolutePosition = {
              x: columnRect.left + (node.position?.x ?? 0),
              y: cursorY,
            };
          }

          return {
            ...node,
            draggable: true,
            // Remove parent reference to make node independent.
            parentNode:
              node.parentNode === ownedBy ? undefined : node.parentNode,
            // Use absolute position so node stays visually in the same place
            position: absolutePosition ?? node.position ?? { x: 0, y: 0 },
            data: restData,
          };
        }

        // Update the owner's children registry to remove the detached node.
        if (
          (node.type === "section" ||
            node.type === "row" ||
            node.type === "header" ||
            node.type === "footer") &&
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

    // Force ReactFlow to recalc internal node state after parent changes (guard older versions).
    requestAnimationFrame(() => {
      const updater = (reactFlow as any).updateNodeInternals;
      if (typeof updater === "function") {
        updater(nodeId);
      }
    });
  };

  // ================================
  // Drag Handling and Hover Detection
  // ================================
  /**
   * Called continuously during node drag to update hover state.
   */
  const handleNodeDrag = (event: any, node: any) => {
    if (!node || !node.id || !node.type) return;
    if (!isColumnDropAllowed(node.type)) return;

    const flowPoint = toFlowPoint(event);
    if (!dragStartPosRef.current && flowPoint) {
      dragStartPosRef.current = { x: flowPoint.x, y: flowPoint.y };
    }

    const target = locateColumnAtPoint(columnRectsRef.current, flowPoint);

    if (node.data?.positionMode === "flow") {
      if (target) {
        const { insertIndex } = computeInsertForFlow(
          nodes,
          target.ownerId,
          target.columnIndex,
          node.id,
          flowPoint?.y,
          columnRectsRef.current
        );
        const movingAcross =
          node.data?._ownedByColumn !== target.ownerId ||
          node.data?._columnIndex !== target.columnIndex;
        const currentOrder = node.data?.order ?? insertIndex;

        if (movingAcross || currentOrder !== insertIndex) {
          setNodes((nds: any[]) =>
            applyFlowPlacement(
              nds,
              target.ownerId,
              target.columnIndex,
              node.id,
              insertIndex
            )
          );
        }

        setFlowReorderState({
          ownerId: target.ownerId,
          columnIndex: target.columnIndex,
          targetIndex: insertIndex,
          nodeId: node.id,
        });
        setHoverState({
          sectionId: target.ownerId,
          columnIndex: target.columnIndex,
        });
      } else {
        if (flowReorderState) {
          setFlowReorderState(null);
        }
        if (hoverState.sectionId || hoverState.columnIndex !== null) {
          setHoverState({ sectionId: null, columnIndex: null });
        }
      }
      return;
    }

    if (
      target?.ownerId !== hoverState.sectionId ||
      target?.columnIndex !== hoverState.columnIndex
    ) {
      setHoverState(
        target
          ? { sectionId: target.ownerId, columnIndex: target.columnIndex }
          : { sectionId: null, columnIndex: null }
      );
    }
  };

  // ================================
  // Find Drop Target
  // ================================
  /**
   * Given a point in flow coordinates, finds which column contains it.
   * Used during node placement (e.g., when clicking to place from toolbar).
   */
  const findDropTarget = useCallback(
    (point: { x: number; y: number }) =>
      locateColumnAtPoint(columnRectsRef.current, point),
    []
  );

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
      // Only layout containers with columns register drop zones.
      if (
        (node.type === "section" ||
          node.type === "row" ||
          node.type === "header" ||
          node.type === "footer") &&
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
