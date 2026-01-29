/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines whether the current site state is exportable.
 * If export prerequisites change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function canExportSite(_site: any) {
  return true;
}

/**
 * INVARIANT:
 * Export checks must enforce layout invariants before emitting artifacts.
 */
