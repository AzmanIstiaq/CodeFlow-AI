import { useRef, useEffect } from "react";
import { useReactFlow } from "reactflow";
import type { SiteSchema } from "../../../types/siteSchema";
import { INVALID_COLUMN_CHILD_TYPES } from "../utils/nodeHelpers";

export function useColumnDropZones(
  site: SiteSchema,
  setSite: React.Dispatch<React.SetStateAction<SiteSchema>>,
  nodes: any[],
  setNodes: (updater: any) => void
) {
  const reactFlow = useReactFlow();
  const { screenToFlowPosition } = reactFlow;

  const viewportVersionRef = useRef(0);
  const columnRectsRef = useRef<Record<string, Record<number, any>>>({});
  const pendingDetachRef = useRef<string | null>(null);

  const handleNodeDragStop = (_: any, node: any) => {
    if (pendingDetachRef.current === node.id) {
      pendingDetachRef.current = null;
      removeNodeFromColumn(node.id);
      pendingDetachRef.current = null;
    }
  };

  /* -------------------------------------------
   * Column Rect Registration
   * ------------------------------------------- */

  const registerColumnRect = (
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
  };

  /* -------------------------------------------
   * Add Node To Column
   * ------------------------------------------- */

  const addNodeToColumn = (
    columnsSectionId: string,
    nodeId: string,
    columnIndex: number
  ) => {
    setNodes((nds: any[]) =>
      nds.map((node) => {
        // Dropped node
        if (node.id === nodeId) {
          if (INVALID_COLUMN_CHILD_TYPES.has(node.type)) return node;

          return {
            ...node,
            draggable: false,
            data: {
              ...node.data,
              _ownedByColumn: columnsSectionId,
              _columnIndex: columnIndex,
            },
          };
        }

        // Update columnsSection children
        if (node.type === "columnsSection") {
          const children = { ...(node.data?.children ?? {}) };

          // Remove node from ALL columns (prevents duplicates)
          Object.keys(children).forEach((k) => {
            children[k] = children[k].filter((id: string) => id !== nodeId);
          });

          // Add to target column
          if (node.id === columnsSectionId) {
            children[columnIndex] = [...(children[columnIndex] ?? []), nodeId];
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
      })
    );

    requestAnimationFrame(() => (reactFlow as any).updateNodeInternals(nodeId));
  };

  /* -------------------------------------------
   * Remove Node From Column
   * ------------------------------------------- */

  const removeNodeFromColumn = (nodeId: string) => {
    setNodes((nds: any[]) => {
      const parentSection = nds.find(
        (n) =>
          n.type === "columnsSection" &&
          Object.values(n.data?.children ?? {}).some((arr: any) =>
            arr.includes(nodeId)
          )
      );

      const basePos = parentSection?.position ?? { x: 200, y: 200 };

      return nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            position: {
              x: basePos.x + 400,
              y: basePos.y + 50,
            },
            draggable: true,
            data: {
              ...node.data,
              _ownedByColumn: undefined,
              _columnIndex: undefined,
            },
          };
        }

        if (node.type === "columnsSection") {
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

    // Drop into column
    if (
      targetSection &&
      targetColIndex !== null &&
      (node.data?._ownedByColumn !== targetSection ||
        node.data?._columnIndex !== targetColIndex)
    ) {
      addNodeToColumn(targetSection, node.id, targetColIndex);
    }

    // Dragged outside column → mark for detach
    if (!targetSection && node.data?._ownedByColumn) {
      pendingDetachRef.current = node.id;
    }
  };

  /* -------------------------------------------
   * Viewport / Rect Recalculation
   * ------------------------------------------- */

  const handleMoveEnd = () => {
    viewportVersionRef.current += 1;
    columnRectsRef.current = {};
  };

  useEffect(() => {
    nodes.forEach((node: any) => {
      if (node.type === "columnsSection" && node.data?.columns) {
        for (let i = 0; i < node.data.columns; i++) {
          const el = document.getElementById(`column-${node.id}-${i}`);
          if (el) {
            registerColumnRect(node.id, i, el.getBoundingClientRect());
          }
        }
      }
    });
  }, [nodes, viewportVersionRef.current]);

  /* -------------------------------------------
   * Sync ReactFlow → Site (Persistence Only)
   * ------------------------------------------- */

  useEffect(() => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === prev.activePageId ? { ...p, nodes } : p
      ),
    }));
  }, [nodes]);

  return {
    registerColumnRect,
    addNodeToColumn,
    removeNodeFromColumn,
    handleMoveEnd,
    handleNodeDrag,
    handleNodeDragStop,
    viewportVersion: viewportVersionRef.current,
  };
}
