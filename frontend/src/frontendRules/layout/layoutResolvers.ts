import {
  DEFAULT_COLUMN_GAP,
  FLOW_DEFAULT_HEIGHT,
  FLOW_MIN_HEIGHT,
  ROW_MIN_HEIGHT,
  DEFAULT_PAGE_HEIGHT,
} from "./layoutMetrics";
import { isBarNode } from "./layoutPolicy";

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how absolute positions are derived from nested nodes.
 * If parent-chain resolution changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function computeAbsolutePosition(
  nodeId: string | undefined | null,
  nodeList: any[]
) {
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
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines the vertical contribution for layout children.
 * If header/footer/row height resolution changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function resolveNodeHeightForLayout(node: any, currentNodes: any[]) {
  if (isBarNode(node.type)) {
    const currentNode = currentNodes.find((n: any) => n.id === node.id);

    if (typeof currentNode?.data?.height === "number") {
      return currentNode.data.height;
    }
    const styleHeight =
      (currentNode?.style?.height as number | undefined) ??
      (currentNode?.height as number | undefined);
    if (typeof styleHeight === "number") {
      return styleHeight;
    }
    if (typeof currentNode?.data?._measuredHeight === "number") {
      return currentNode.data._measuredHeight;
    }
    return 0;
  }

  if (node.type === "row") {
    const h =
      node.data?.rowHeight ??
      (node.style?.height as number | undefined) ??
      (node.height as number | undefined);
    return typeof h === "number" ? Math.max(h, ROW_MIN_HEIGHT) : ROW_MIN_HEIGHT;
  }

  return 0;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how header/footer/row children are anchored inside a section.
 * If stacking rules or ordering change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function computeLayoutMaps(nodes: any[]) {
  const layout = new Map<
    string,
    { x: number; y: number; width: number; height: number }
  >();
  const sectionHeights = new Map<string, number>();
  const sections = nodes.filter((n: any) => n.type === "section");

  sections.forEach((section: any) => {
    const sectionWidth =
      section.width ?? section.data?.pageWidth ?? section.data?.maxWidth ?? 0;

    const layoutChildren = nodes
      .filter(
        (n: any) =>
          n.parentNode === section.id &&
          (n.type === "header" || n.type === "footer" || n.type === "row")
      )
      .sort((a: any, b: any) => {
        if (a.type === "header" && b.type !== "header") return -1;
        if (b.type === "header" && a.type !== "header") return 1;
        if (a.type === "footer" && b.type !== "footer") return 1;
        if (b.type === "footer" && a.type !== "footer") return -1;
        return (a.data?.order ?? 0) - (b.data?.order ?? 0);
      });

    let currentY = 0;
    let footerNode: any = null;
    let footerHeight = 0;
    const minHeight = section.data?.pageHeight ?? 0;

    layoutChildren.forEach((child: any) => {
      const height = resolveNodeHeightForLayout(child, nodes);
      if (child.type === "footer") {
        footerNode = child;
        footerHeight = height;
        return;
      }
      layout.set(child.id, { x: 0, y: currentY, width: sectionWidth, height });
      currentY += height;
    });

    const bodyHeight = Math.max(currentY, minHeight);
    if (footerNode) {
      layout.set(footerNode.id, {
        x: 0,
        y: bodyHeight,
        width: sectionWidth,
        height: footerHeight,
      });
    }

    const totalHeight = footerNode ? bodyHeight + footerHeight : bodyHeight;
    sectionHeights.set(section.id, totalHeight);
  });

  return { layoutById: layout, sectionHeightById: sectionHeights };
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines the Y-offset stacking for flow-positioned nodes.
 * If flow stacking or gap math changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function computeFlowStackOffsets(nodes: any[]) {
  const offsets = new Map<string, number>();
  const groups = new Map<string, any[]>();

  const getNodeHeight = (node: any) => {
    const h =
      (node.style?.height as number | undefined) ??
      (node.height as number | undefined) ??
      (node.data?.height as number | undefined);
    if (typeof h === "number") return Math.max(h, FLOW_MIN_HEIGHT);
    return FLOW_DEFAULT_HEIGHT;
  };

  nodes.forEach((n: any) => {
    if (n.data?.positionMode !== "flow") return;
    if (n.data?._ownedByColumn === undefined || n.data?._columnIndex === undefined)
      return;
    const key = `${n.data._ownedByColumn}:${n.data._columnIndex}`;
    const list = groups.get(key) ?? [];
    list.push(n);
    groups.set(key, list);
  });

  groups.forEach((list, key) => {
    const [ownerId] = key.split(":");
    const owner = nodes.find((n: any) => n.id === ownerId);
    const columnGap =
      (owner?.data?.columns?.gap as number | undefined) !== undefined
        ? owner?.data?.columns?.gap
        : DEFAULT_COLUMN_GAP;
    const columnPaddingY = owner?.type === "row" ? owner.data?.padding ?? 0 : 0;

    list
      .sort((a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0))
      .forEach((n: any, idx: number) => {
        const prevHeight = idx === 0 ? 0 : getNodeHeight(list[idx - 1]);
        const prevOffset =
          idx === 0
            ? columnPaddingY
            : offsets.get(list[idx - 1].id) ?? columnPaddingY;
        const nextOffset =
          idx === 0 ? columnPaddingY : prevOffset + prevHeight + (columnGap ?? 0);
        offsets.set(n.id, nextOffset);
      });
  });

  return offsets;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how flow-positioned nodes derive render coordinates.
 * If flow render math changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getFlowRenderPosition(
  node: any,
  flowStackOffsets: Map<string, number>,
  nodes: any[],
  layoutById: Map<string, { x: number; y: number; width: number; height: number }>
) {
  if (node?.data?.positionMode !== "flow") return node?.position;
  const flowY = flowStackOffsets.get(node.id) ?? 0;
  let flowX = 0;
  if (
    node.data?._columnIndex !== undefined &&
    node.data?._ownedByColumn
  ) {
    const owner = nodes.find((n: any) => n.id === node.data?._ownedByColumn);
    const ownerLayout = layoutById.get(node.data?._ownedByColumn);
    const ownerWidth =
      ownerLayout?.width ??
      owner?.style?.width ??
      owner?.width ??
      owner?.data?.width ??
      0;
    const columnCount =
      owner?.data?.columns?.count ?? owner?.data?.columns ?? 1;
    if (ownerWidth && columnCount > 0) {
      flowX = (ownerWidth / columnCount) * node.data._columnIndex;
    }
  }
  return { x: flowX, y: flowY };
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how section render height is derived from children.
 * If height aggregation changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function computeSectionRenderHeight({
  sectionId,
  pageHeight = DEFAULT_PAGE_HEIGHT,
  computedHeightOverride,
  rowNodes,
  allNodes,
  sectionGap = 0,
  sectionPadding = 0,
}: {
  sectionId: string;
  pageHeight?: number;
  computedHeightOverride?: number;
  rowNodes: any[];
  allNodes: any[];
  sectionGap?: number;
  sectionPadding?: number;
}) {
  if (typeof computedHeightOverride === "number") {
    return Math.max(computedHeightOverride, pageHeight);
  }
  const minHeight = pageHeight;
  if (rowNodes.length === 0) {
    const layoutChildren =
      allNodes?.filter(
        (n: any) =>
          n.parentNode === sectionId &&
          (n.type === "header" || n.type === "footer" || n.type === "row")
      ) || [];
    if (layoutChildren.length > 0) {
      const total = layoutChildren.reduce((acc: number, child: any) => {
        const h =
          (child.style?.height as number | undefined) ??
          (child.data?.height as number | undefined) ??
          (child.data?.rowHeight as number | undefined) ??
          (child.height as number | undefined) ??
          0;
        return acc + Math.max(h, ROW_MIN_HEIGHT);
      }, 0);
      return Math.max(minHeight, total);
    }
    return minHeight;
  }

  const rowsHeight = rowNodes.reduce((sum: number, row: any) => {
    const isOnlyRow = rowNodes.length === 1;
    if (isOnlyRow && typeof pageHeight === "number") {
      return sum + Math.max(0, pageHeight);
    }
    if (typeof row.data?.rowHeight === "number") {
      return sum + Math.max(0, row.data.rowHeight);
    }

    const rowChildren = allNodes?.filter(
      (n: any) => n.data?._rowId === row.id
    );
    const rowHeight =
      rowChildren && rowChildren.length > 0
        ? Math.max(
            ...rowChildren.map((child: any) => {
              const height = child.height ?? child.data?.height ?? 0;
              return (child.position?.y ?? 0) + height;
            })
          ) -
          Math.min(...rowChildren.map((child: any) => child.position?.y ?? 0))
        : row.height ?? 0;
    return sum + Math.max(0, rowHeight);
  }, 0);

  // Include header/footer heights alongside row content so section bounds wrap all children.
  const barHeight = allNodes
    ?.filter(
      (n: any) =>
        n.parentNode === sectionId &&
        (n.type === "header" || n.type === "footer")
    )
    .reduce((sum: number, bar: any) => {
      const h =
        (bar.style?.height as number | undefined) ??
        (bar.data?.height as number | undefined) ??
        (bar.height as number | undefined) ??
        0;
      return sum + Math.max(h, ROW_MIN_HEIGHT);
    }, 0) ?? 0;

  const gapsHeight = Math.max(0, rowNodes.length - 1) * sectionGap;
  const contentHeight = rowsHeight + gapsHeight + sectionPadding * 2 + barHeight;

  return Math.max(minHeight, contentHeight);
}
