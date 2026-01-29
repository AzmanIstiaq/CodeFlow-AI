/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines z-index ownership per node type.
 * If stacking roles change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getLayerZIndex(nodeType: string) {
  if (nodeType === "section") return 0;
  if (nodeType === "row" || nodeType === "header" || nodeType === "footer") return 1;
  return 10;
}

/**
 * INVARIANT:
 * Sections stay beneath rows/bars; content always renders above structural frames.
 */
