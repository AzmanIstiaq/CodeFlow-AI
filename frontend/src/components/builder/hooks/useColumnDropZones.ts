import { useRef, useEffect, useState, useCallback } from "react";
import { useReactFlow } from "reactflow";
import { INVALID_COLUMN_CHILD_TYPES } from "../utils/nodeHelpers";

export function useColumnDropZones(
  nodes: any[],
  setNodes: (updater: any) => void
) {
  const reactFlow = useReactFlow();
  const { screenToFlowPosition } = reactFlow;

  const viewportVersionRef = useRef(0);
  const columnRectsRef = useRef<Record<string, Record<number, any>>>({});
  const pendingDetachRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hoverState, setHoverState] = useState<{
    sectionId: string | null;
    columnIndex: number | null;
  }>({ sectionId: null, columnIndex: null });

  const handleNodeDragStop = (event: any, node: any) => {
    if (!node || !node.id || !node.type || !node.position) return;
    
    // Check if node was actually dragged (not just clicked)
    const wasDragged = dragStartPosRef.current && node.position && (
      Math.abs(node.position.x - dragStartPosRef.current.x) > 5 ||
      Math.abs(node.position.y - dragStartPosRef.current.y) > 5
    );
    
    // Snap to hovered column on release
    if (hoverState.sectionId && hoverState.columnIndex !== null) {
      if (INVALID_COLUMN_CHILD_TYPES.has(node.type)) {
        setHoverState({ sectionId: null, columnIndex: null });
        dragStartPosRef.current = null;
        return;
      }
      const clientX = event?.clientX;
      const clientY = event?.clientY;
      const dropPoint =
        typeof clientX === "number" && typeof clientY === "number"
          ? screenToFlowPosition({ x: clientX, y: clientY })
          : node.positionAbsolute
          ? { x: node.positionAbsolute.x, y: node.positionAbsolute.y }
          : node.position;
      addNodeToColumn(hoverState.sectionId, node.id, hoverState.columnIndex, dropPoint);
    } else if (node.data?._ownedByColumn && wasDragged) {
      // Only detach if node was actually dragged outside (not just clicked)
      removeNodeFromColumn(node.id);
    }
    
    // Clear hover state and drag start position
    setHoverState({ sectionId: null, columnIndex: null });
    pendingDetachRef.current = null;
    dragStartPosRef.current = null;
  };

  /* -------------------------------------------
   * Column Rect Registration
   * ------------------------------------------- */

  const registerColumnRect = useCallback((
    sectionId: string,
    colIndex: number,
    rect: DOMRect
  ) => {
    const topLeft = screenToFlowPosition({
      x: rect.left,
      y: rect.top,
    });

    const bottomRight = screenToFlowPosition({
      x: rect.right,
      y: rect.bottom,
    });

    if (!columnRectsRef.current[sectionId]) {
      columnRectsRef.current[sectionId] = {};
    }

    columnRectsRef.current[sectionId][colIndex] = {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
    };
  }, [screenToFlowPosition]);

  /* -------------------------------------------
   * Add Node To Column
   * ------------------------------------------- */

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
        // Dropped node - keep its current position but mark it as owned by column
        if (node.id === nodeId) {
          if (INVALID_COLUMN_CHILD_TYPES.has(node.type)) return node;

          // Keep the current position where user dropped it
          // Only constrain X to be within column bounds
          let newPosition = node.position;
          if (columnRect && dropPoint) {
            const localX = Math.max(0, Math.min(columnWidth, dropPoint.x - columnRect.left));
            const localY = dropPoint.y - rowTop;
            newPosition = isRowOwner
              ? {
                  x: columnWidth * columnIndex + localX,
                  y: localY,
                }
              : {
                x: dropPoint.x,
                y: dropPoint.y,
              };
          }

          return {
            ...node,
            position: newPosition,
            draggable: true,
            ...(isRowOwner ? { parentNode: columnsSectionId } : {}),
            data: {
              ...node.data,
              _ownedByColumn: columnsSectionId,
              _columnIndex: columnIndex,
              ...(isRowOwner ? { _rowId: columnsSectionId } : {}),
              ...(isRowOwner && dropPoint && columnRect
                ? { _localY: dropPoint.y - rowTop }
                : {}),
              ...(isRowOwner ? { columnIndex } : {}),
            },
          };
        }

        // Update owner with columns
        if (
          (node.type === "section" || node.type === "row") &&
          node.data?.columns &&
          node.id === columnsSectionId
        ) {
          const children = { ...(node.data?.children ?? {}) };

          // Remove node from ALL columns (prevents duplicates)
          Object.keys(children).forEach((k) => {
            children[k] = children[k].filter((id: string) => id !== nodeId);
          });

          // Add to target column
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

  /* -------------------------------------------
   * Remove Node From Column
   * ------------------------------------------- */

  const removeNodeFromColumn = (nodeId: string) => {
    setNodes((nds: any[]) => {
      return nds.map((node) => {
        if (node.id === nodeId) {
          const ownedBy = node.data?._ownedByColumn;
          const { _ownedByColumn, _columnIndex, columnIndex, _rowId, _localY, ...restData } = node.data || {};
          const parent = nds.find((n) => n.id === ownedBy);
          const section = parent?.parentNode
            ? nds.find((n) => n.id === parent.parentNode)
            : null;
          const parentPosition = parent?.position ?? { x: 0, y: 0 };
          const sectionPosition = section?.position ?? { x: 0, y: 0 };
          const absolutePosition = node.parentNode === ownedBy
            ? {
                x: (node.position?.x ?? 0) + parentPosition.x + sectionPosition.x,
                y: (node.position?.y ?? 0) + parentPosition.y + sectionPosition.y,
              }
            : node.position;
          return {
            ...node,
            // Keep the current position - don't move it
            draggable: true,
            parentNode: node.parentNode === ownedBy ? undefined : node.parentNode,
            position: absolutePosition,
            data: restData,
          };
        }

        if ((node.type === "section" || node.type === "row") && node.data?.columns) {
          const children = { ...(node.data?.children ?? {}) };

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

    requestAnimationFrame(() => (reactFlow as any).updateNodeInternals(nodeId));
  };

  /* -------------------------------------------
   * Drag Handling
   * ------------------------------------------- */

  const handleNodeDrag = (node: any) => {
    // Track drag start position on first drag event
    if (!dragStartPosRef.current) {
      dragStartPosRef.current = { x: node.position.x, y: node.position.y };
    }
    
    if (!node || !node.id || !node.type) return;
    if (INVALID_COLUMN_CHILD_TYPES.has(node.type)) return;
    if (!node.positionAbsolute || !node.width || !node.height) return;

    const nodeRect = {
      left: node.positionAbsolute.x,
      right: node.positionAbsolute.x + node.width,
      top: node.positionAbsolute.y,
      bottom: node.positionAbsolute.y + node.height,
    };

    let targetSection: string | null = null;
    let targetColIndex: number | null = null;

    for (const [sectionId, columns] of Object.entries(columnRectsRef.current)) {
      for (const [colIndex, rect] of Object.entries(columns)) {
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

    // Update hover state for visual feedback
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

  const findDropTarget = useCallback((point: { x: number; y: number }) => {
    for (const [sectionId, columns] of Object.entries(columnRectsRef.current)) {
      for (const [colIndex, rect] of Object.entries(columns)) {
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

  /* -------------------------------------------
   * Viewport / Rect Recalculation
   * ------------------------------------------- */

  const handleMoveEnd = () => {
    viewportVersionRef.current += 1;
    columnRectsRef.current = {};
  };

  useEffect(() => {
    nodes.forEach((node: any) => {
      if ((node.type === "section" || node.type === "row") && node.data?.columns) {
        const columnCount = node.data.columns.count || node.data.columns;
        for (let i = 0; i < columnCount; i++) {
          const el = document.getElementById(`column-${node.id}-${i}`);
          if (el) {
            registerColumnRect(node.id, i, el.getBoundingClientRect());
          }
        }
      }
    });
  }, [nodes, viewportVersionRef.current, registerColumnRect]);

  /* -------------------------------------------
   * Sync ReactFlow → Site (Persistence Only)
   * ------------------------------------------- */
  // Note: Site sync is now handled in PageBuilderInner to avoid infinite loops

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
