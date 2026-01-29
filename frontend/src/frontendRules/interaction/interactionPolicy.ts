/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines when a node is draggable.
 * If drag enablement changes (locked nodes, flow nodes), fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function isNodeDraggable({
  node,
  isFlow,
  baseDraggable,
  isSelected,
}: {
  node: any;
  isFlow: boolean;
  baseDraggable: boolean;
  isSelected?: boolean;
}) {
  const locked = node?.data?.locked;
  if (node.type === "row" || node.type === "section") return false;
  if (node.type === "header" || node.type === "footer") {
    return !!isSelected;
  }
  return !locked && (isFlow ? true : baseDraggable);
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines whether smart guides apply during drag.
 * If guide eligibility changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function shouldUseSmartGuides(node: any) {
  return node?.data?.positionMode !== "flow";
}

/**
 * INVARIANT:
 * Flow-positioned nodes bypass guide snapping but remain draggable unless locked.
 */
