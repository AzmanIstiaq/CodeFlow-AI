/**
 * File: layeringResolvers.ts
 *
 * Purpose:
 * - Resolve z-index normalization for builder nodes.
 *
 * Controls:
 * - Canonical z-index assignment by node type.
 *
 * Directly related files:
 * - frontend/src/frontendRules/layering/layeringPolicy.ts
 * - frontend/src/pages/PageBuilderInner.tsx
 */

import { getLayerZIndex } from "./layeringPolicy";

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines canonical z-index normalization.
 * If layering rules change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function normalizeZIndex(nodeList: any[]) {
  return nodeList.map((node: any) => {
    const zIndex = getLayerZIndex(node.type);
    return node.zIndex === zIndex ? node : { ...node, zIndex };
  });
}
