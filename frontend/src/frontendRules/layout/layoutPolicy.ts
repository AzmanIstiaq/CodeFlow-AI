import { HEADER_DEFAULT_HEIGHT, FOOTER_DEFAULT_HEIGHT } from "./layoutMetrics";

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines which node types are treated as pinned bars (header/footer).
 * If bar ownership rules change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function isBarNode(nodeType: string) {
  return nodeType === "header" || nodeType === "footer";
}

/**
 * INVARIANT:
 * Headers and footers contribute height but never own inter-column spacing.
 */

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines the default heights for bar nodes.
 * If bar height defaults drift, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getDefaultBarHeight(nodeType: string) {
  if (nodeType === "header") return HEADER_DEFAULT_HEIGHT;
  if (nodeType === "footer") return FOOTER_DEFAULT_HEIGHT;
  return 0;
}
