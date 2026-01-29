/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how sections bundle with their header/footer for selection.
 * If bundling membership changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function bundleSectionSelection(nodes: any[], sectionNode: any) {
  const barNodes = nodes.filter(
    (n: any) =>
      n.parentNode === sectionNode.id &&
      (n.type === "header" || n.type === "footer")
  );
  return [sectionNode, ...barNodes];
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines which node drives the inspector when multiple are selected.
 * If inspector targeting changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function deriveInspectorSelection(selectedNodes: any[]) {
  const section = selectedNodes.find((n: any) => n.type === "section");
  if (section) return [section];
  return selectedNodes;
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines hit testing for selecting the frame via empty space clicks.
 * If frame hit rules change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function isPointInsideFrame(
  flowPoint: { x: number; y: number },
  frameNode: any,
  frameHeight: number
) {
  const width =
    frameNode.width ??
    frameNode.data?.pageWidth ??
    frameNode.data?.maxWidth ??
    frameNode.style?.width ??
    0;
  const within =
    flowPoint.x >= frameNode.position.x &&
    flowPoint.x <= frameNode.position.x + width &&
    flowPoint.y >= frameNode.position.y &&
    flowPoint.y <= frameNode.position.y + frameHeight;
  return within;
}
