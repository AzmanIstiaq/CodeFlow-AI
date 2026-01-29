import { BAR_MIN_HEIGHT, BAR_MIN_WIDTH } from "../layout/layoutMetrics";
import { isBarNode } from "../layout/layoutPolicy";

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines which nodes support manual resize.
 * If resize eligibility changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function isResizableNode(nodeType: string) {
  return isBarNode(nodeType) || true;
}

/**
 * INVARIANT:
 * Bar resize constraints guard minimum touch targets; do not relax them.
 */

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines minimum constraints for bar resize handles.
 * If header/footer constraints change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getBarResizeConstraints() {
  return { minWidth: BAR_MIN_WIDTH, minHeight: BAR_MIN_HEIGHT };
}
