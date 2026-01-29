/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines which modifier selects multiple nodes.
 * If multi-select key changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getMultiSelectKey() {
  return "Shift";
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines when canvas-level dragging should be disabled.
 * If drag cancellation rules change (drawing, resizing), fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function allowCanvasDrag({
  drawingMode,
  isResizing,
  isEditingRadius,
}: {
  drawingMode: any;
  isResizing: boolean;
  isEditingRadius: boolean;
}) {
  return !drawingMode && !isResizing && !isEditingRadius;
}
