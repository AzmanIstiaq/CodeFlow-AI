import { useCallback, useState } from "react";
import { exportNextJSZip } from "../../utils/exportNextJsZip";
import { canExportSite } from "../../frontendRules/export/exportPolicy";

interface UsePageBuilderExportProps {
  site: any;
  nodes: any[];
}

/**
 * Export workflow hook for PageBuilderInner.
 *
 * Keeps export validation, snapshot wiring, and async state out of the view
 * component while preserving existing export behavior.
 */
export function usePageBuilderExport({ site, nodes }: UsePageBuilderExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const snapshotNodesForExport = useCallback(() => {
    // Preserve structural wrappers (rows/columns) to match canvas semantics.
    return nodes;
  }, [nodes]);

  const handleExportNextJSZip = useCallback(async () => {
    if (isExporting) return;

    const snapshotNodes = snapshotNodesForExport();
    const snapshotSite = {
      ...site,
      pages: site.pages.map((p: any) =>
        p.id === site.activePageId ? { ...p, nodes: snapshotNodes } : p
      ),
    };

    const gate = canExportSite(snapshotSite as any);
    if (!gate.ok) {
      alert(`Cannot export:\n${gate.reasons.join("\n")}`);
      return;
    }

    setIsExporting(true);
    try {
      await exportNextJSZip(snapshotSite as any, gate.diagnostics, {
        pixelPerfect: false,
      });
    } catch (err) {
      console.error(err);
      alert(`Export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, snapshotNodesForExport, site]);

  return { isExporting, handleExportNextJSZip };
}
