/**
 * File: flowPolicy.ts
 *
 * Purpose:
 * - Define canonical flow/column policy decisions used across builder logic.
 *
 * Controls:
 * - Drop eligibility and column ownership metadata keys.
 *
 * Directly related files:
 * - frontend/src/frontendRules/flow/flowResolvers.ts
 * - frontend/src/pages/PageBuilderInner.tsx
 */

import { INVALID_COLUMN_CHILD_TYPES } from "../../components/builder/utils/nodeHelpers";

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines which node types cannot be dropped into columns.
 * If drop bans change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function isColumnDropAllowed(nodeType: string) {
  return !INVALID_COLUMN_CHILD_TYPES.has(nodeType);
}

/**
 * INVARIANT:
 * Column ownership is tracked only via _ownedByColumn/_columnIndex metadata.
 */

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines the ownership fields used for column membership.
 * If metadata keys change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function getColumnOwnershipKeys() {
  return {
    ownerKey: "_ownedByColumn",
    columnIndexKey: "_columnIndex",
    rowKey: "_rowId",
  };
}
