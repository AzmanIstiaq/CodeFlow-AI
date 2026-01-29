const SUPPORTED_COLUMN_CONTROL_TYPES = new Set(["header", "footer", "section"]);
const COLUMN_OPTIONS = [1, 2, 3, 4, 6];

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines which node types expose column controls.
 * If eligibility changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function isColumnControlSupported(nodeType: string) {
  return SUPPORTED_COLUMN_CONTROL_TYPES.has(nodeType);
}

/**
 * INVARIANT:
 * Column editing never reassigns ownership keys; it only remaps children per policy.
 */

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines available column count presets.
 * If presets change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getColumnOptions() {
  return COLUMN_OPTIONS;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how we read the current column count.
 * If count resolution changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getColumnCount(node: any) {
  return typeof node.data?.columns?.count === "number"
    ? node.data.columns.count
    : 1;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how column gap is derived per node.
 * If gap ownership changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getColumnGap(node: any) {
  return node.type === "header" || node.type === "footer"
    ? 0
    : typeof node.data?.columns?.gap === "number"
      ? node.data.columns.gap
      : 24;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines owned column children for a node.
 * If ownership keys change, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getOwnedColumnChildren(nodeId: string, allNodes: any[]) {
  return allNodes?.filter((n) => n.data?._ownedByColumn === nodeId) ?? [];
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines normalization of children map when column count changes.
 * If redistribution rules change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function normalizeChildrenMap(
  ownedChildren: any[],
  nextCount: number
) {
  if (!ownedChildren.length) return null;
  const lastIdx = Math.max(0, nextCount - 1);
  const map: Record<number, string[]> = {};

  const getChildColumn = (child: any) => {
    const idx =
      typeof child.data?._columnIndex === "number"
        ? child.data._columnIndex
        : typeof child.data?.columnIndex === "number"
          ? child.data.columnIndex
          : 0;
    return idx;
  };

  ownedChildren.forEach((child) => {
    const clamped = Math.min(Math.max(getChildColumn(child), 0), lastIdx);
    if (!map[clamped]) map[clamped] = [];
    if (!map[clamped].includes(child.id)) {
      map[clamped].push(child.id);
    }
  });

  return map;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how overflowed children are updated when columns shrink.
 * If clamp rules change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function buildOverflowUpdates(ownedChildren: any[], nextCount: number) {
  const updates: { id: string; updates: any }[] = [];
  if (!ownedChildren.length) return updates;
  const lastIdx = Math.max(0, nextCount - 1);

  const getChildColumn = (child: any) => {
    const idx =
      typeof child.data?._columnIndex === "number"
        ? child.data._columnIndex
        : typeof child.data?.columnIndex === "number"
          ? child.data.columnIndex
          : 0;
    return idx;
  };

  const overflow = ownedChildren.filter(
    (child) => getChildColumn(child) >= nextCount
  );

  if (!overflow.length) return updates;

  const targetSiblings = ownedChildren.filter(
    (child) => getChildColumn(child) === lastIdx
  );

  let orderCursor =
    Math.max(
      -1,
      ...targetSiblings.map((n) =>
        typeof n.data?.order === "number" ? n.data.order : -1
      )
    ) + 1;

  overflow.forEach((child) => {
    const change: any = {
      _columnIndex: lastIdx,
      columnIndex: lastIdx,
    };

    if (child.data?.positionMode === "flow") {
      change.order = orderCursor++;
    }

    updates.push({ id: child.id, updates: change });
  });

  return updates;
}
