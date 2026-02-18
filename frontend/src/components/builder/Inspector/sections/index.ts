/**
 * Inspector Sections Index
 *
 * Purpose:
 * - Aggregate exports for inspector section components.
 *
 * Role in the system:
 * - Provides a single import surface for the inspector panel.
 *
 * Key responsibilities:
 * - Re-export section modules without additional logic.
 */

export { default as LayoutPosition } from "./LayoutPosition";
export { default as RowControl } from "./RowControl";
export { default as ColumnControl } from "./ColumnControl";
export { default as FlowSpacing } from "./FlowSpacing";
export { default as Style } from "./Style";
export { default as Text } from "./Text";
export { default as Effects } from "./Effects";
export { default as Advanced } from "./Advanced";
