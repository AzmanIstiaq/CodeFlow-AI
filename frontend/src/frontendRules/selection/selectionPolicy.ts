/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines whether selecting a section should also select bars.
 * If bundling rules change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function shouldBundleSectionWithBars(nodeType: string) {
  return nodeType === "section";
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines when row selection should be redirected to its section.
 * If row redirection rules change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function shouldRedirectRowSelection(nodeType: string) {
  return nodeType === "row";
}

/**
 * INVARIANT:
 * Rows redirect selection to their owning section to keep inspector targeting stable.
 */
