/**
 * File: flowResolvers.ts
 *
 * Purpose:
 * - Resolve runtime calculations for flow placement, column hit testing, and ordering.
 *
 * Controls:
 * - Placement coordinates, insert indices, and ownership/order mutations for flow nodes.
 *
 * Directly related files:
 * - frontend/src/frontendRules/flow/flowPolicy.ts
 * - frontend/src/pages/PageBuilderInner.tsx
 */

import {
  DEFAULT_COLUMN_GAP,
  DEFAULT_SECTION_PADDING,
  BAR_COLUMN_GAP,
} from "../layout/layoutMetrics";
import { isBarNode } from "../layout/layoutPolicy";
import { getColumnOwnershipKeys } from "./flowPolicy";

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how node size is derived for drop math.
 * If node size resolution changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function deriveNodeSize(node: any) {
  const width =
    (node?.style?.width as number | undefined) ??
    (node?.width as number | undefined) ??
    (node?.data?.width as number | undefined) ??
    0;
  const height =
    (node?.style?.height as number | undefined) ??
    (node?.height as number | undefined) ??
    (node?.data?.height as number | undefined) ??
    0;
  return { width, height };
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines minimum node height for flow stacking.
 * If flow height clamps change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function deriveNodeHeight(node: any) {
  const h =
    (node?.style?.height as number | undefined) ??
    (node?.height as number | undefined) ??
    (node?.data?.height as number | undefined);
  return typeof h === "number" ? Math.max(h, 16) : 48;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines column gap and vertical padding rules per owner.
 * If column spacing ownership changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function deriveColumnMetrics(owner: any) {
  const gap = isBarNode(owner?.type)
    ? BAR_COLUMN_GAP
    : (owner?.data?.columns?.gap as number | undefined) !== undefined
      ? owner?.data?.columns?.gap
      : DEFAULT_COLUMN_GAP;
  const paddingY =
    typeof owner?.data?.padding === "number"
      ? owner.data.padding
      : owner?.type === "section"
        ? DEFAULT_SECTION_PADDING
        : 0;
  return { gap, paddingY };
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how we locate a column rect at a point.
 * If drop hit-testing changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function locateColumnAtPoint(
  columnRects: Record<string, Record<number, any>>,
  point: { x: number; y: number } | null
) {
  if (!point) return null;
  for (const [sectionId, columns] of Object.entries(columnRects)) {
    for (const [colIndex, rect] of Object.entries(columns)) {
      const inside =
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom;
      if (inside) {
        return { ownerId: sectionId, columnIndex: Number(colIndex), rect };
      }
    }
  }
  return null;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines where a flow node should be inserted within a column.
 * If insert ordering rules change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function computeInsertForFlow(
  nodeList: any[],
  ownerId: string,
  columnIndex: number,
  nodeId: string,
  pointY?: number,
  columnRects?: Record<string, Record<number, any>>
) {
  const ownerNode = nodeList.find((n) => n.id === ownerId);
  const { gap: columnGap, paddingY: columnPaddingY } = deriveColumnMetrics(ownerNode);
  const columnRect = columnRects?.[ownerId]?.[columnIndex];

  const siblings = nodeList
    .filter(
      (n) =>
        n.id !== nodeId &&
        n.type !== "column" &&
        n.data?._ownedByColumn === ownerId &&
        n.data?._columnIndex === columnIndex
    )
    .sort((a, b) => (a.data?.order ?? 0) - (b.data?.order ?? 0));

  const localY =
    columnRect && typeof pointY === "number"
      ? Math.max(0, pointY - columnRect.top)
      : typeof pointY === "number"
        ? Math.max(0, pointY)
        : 0;

  let insertIndex = siblings.length;
  let cursor = columnPaddingY;
  for (let i = 0; i < siblings.length; i++) {
    const sib = siblings[i];
    const h = deriveNodeHeight(sib);
    if (localY < cursor + h / 2) {
      insertIndex = i;
      break;
    }
    cursor += h + columnGap;
  }

  return { insertIndex, siblings, columnRect, ownerNode };
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how flow placement mutates ownership and order.
 * If column ownership writes change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function applyFlowPlacement(
  nodeList: any[],
  ownerId: string,
  columnIndex: number,
  nodeId: string,
  insertIndex: number
) {
  const { ownerKey, columnIndexKey, rowKey } = getColumnOwnershipKeys();
  const dragged = nodeList.find((n) => n.id === nodeId);
  if (!dragged) return nodeList;

  const ownerNode = nodeList.find((n) => n.id === ownerId);
  const isRowOwner = ownerNode?.type === "row";

  const sourceOwner = dragged.data?.[ownerKey];
  const sourceCol = dragged.data?.[columnIndexKey];

  const targetSiblings = nodeList
    .filter(
      (n) =>
        n.id !== nodeId &&
        n.type !== "column" &&
        n.data?.[ownerKey] === ownerId &&
        n.data?.[columnIndexKey] === columnIndex
    )
    .sort((a, b) => (a.data?.order ?? 0) - (b.data?.order ?? 0));

  const targetList = [...targetSiblings];
  targetList.splice(insertIndex, 0, dragged);

  const movingAcross =
    sourceOwner !== undefined &&
    (sourceOwner !== ownerId || sourceCol !== columnIndex);

  const sourceSiblings = movingAcross
    ? nodeList
        .filter(
          (n) =>
            n.id !== nodeId &&
            n.type !== "column" &&
            n.data?.[ownerKey] === sourceOwner &&
            n.data?.[columnIndexKey] === sourceCol
        )
        .sort((a, b) => (a.data?.order ?? 0) - (b.data?.order ?? 0))
    : [];

  const targetOrders = new Map<string, number>();
  targetList.forEach((n, idx) => targetOrders.set(n.id, idx));
  const sourceOrders = new Map<string, number>();
  sourceSiblings.forEach((n, idx) => sourceOrders.set(n.id, idx));

  return nodeList.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        parentNode: ownerId,
        position: { x: 0, y: 0 },
        draggable: true,
        data: {
          ...node.data,
          [ownerKey]: ownerId,
          [columnIndexKey]: columnIndex,
          ...(isRowOwner ? { [rowKey]: ownerId, columnIndex } : { columnIndex }),
          order: insertIndex,
        },
      };
    }

    if (targetOrders.has(node.id)) {
      return {
        ...node,
        data: {
          ...node.data,
          order: targetOrders.get(node.id),
        },
      };
    }

    if (sourceOrders.has(node.id)) {
      return {
        ...node,
        data: {
          ...node.data,
          order: sourceOrders.get(node.id),
        },
      };
    }

    if (
      (node.type === "section" ||
        node.type === "row" ||
        node.type === "header" ||
        node.type === "footer") &&
      node.data?.columns
    ) {
      if (node.id === ownerId || node.id === sourceOwner) {
        const children = { ...(node.data?.children ?? {}) };

        Object.keys(children).forEach((k) => {
          children[k] = children[k].filter((id: string) => id !== nodeId);
        });

        if (node.id === ownerId) {
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
    }

    return node;
  });
}
