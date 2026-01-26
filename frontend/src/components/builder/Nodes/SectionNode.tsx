/**
 * SectionNode Component
 *
 * Renders a top-level container (frame/section) that holds all page content.
 * Can have optional column-based layout for structured multi-column designs.
 *
 * Key Responsibilities:
 * 1. Display fixed-width page container (default 1280px)
 * 2. Support dynamic height based on content
 * 3. Manage column layout if enabled
 * 4. Route to ColumnsSectionNode if columns exist
 * 5. Support background styling and padding
 * 6. Render rows and child nodes with proper z-index
 *
 * Data Props:
 * - pageWidth/pageHeight: Container dimensions
 * - backgroundColor, backgroundImage: Styling
 * - padding, gap: Spacing
 * - columns?: { count, gap } - Enable column layout
 * - align: "start" | "center" - Vertical alignment
 * - isParentOfSelected?: boolean - Visual feedback
 * - _allNodes?: Array - All nodes for child filtering
 *
 * Architectural Note:
 * - Sections use margin: "0 auto" for centering (CSS centering, not ReactFlow positioning)
 * - Child nodes use relative positioning within section bounds
 * - Column layout delegated to ColumnsSectionNode
 * - Rows are ordered by data.order field
 * - Height auto-grows based on content height
 *
 * Performance:
 * - useMemo for calculated height to avoid unnecessary recomputes
 * - Filters children by _ownedByColumn metadata
 * - Sorts rows by order field once per render
 */

import { type NodeProps } from "reactflow";
import { useMemo } from "react";
import ColumnsSectionNode from "./ColumnsSectionNode";

export type SectionNodeData = {
  label?: string;

  // Page sizing
  pageWidth: number; // e.g. 1280 (FIXED)
  pageHeight: number; // editable (e.g. 800)

  padding: number;
  gap: number;

  align: "start" | "center";
  maxWidth: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  order: number;
  isParentOfSelected?: boolean;

  columns?: {
    count: number;
    gap: number;
  };

  _allNodes?: any[];
};

export default function SectionNode({
  id,
  data,
  selected,
}: NodeProps<
  SectionNodeData & {
    _registerColumnRect?: (
      sectionId: string,
      columnIndex: number,
      rect: DOMRect
    ) => void;
    _viewportVersion?: number;
    _hoverState?: {
      sectionId: string | null;
      columnIndex: number | null;
    };
  }
>) {
  // =====================================
  // COLUMN SETUP
  // =====================================
  // If columns enabled, delegate to specialized component
  const columnCount = data.columns?.count ?? 0;
  const hasRows = (data._allNodes ?? []).some(
    (n) => n.type === "row" && n.parentNode === id
  );
  const computedHeightOverride = (data as any)._computedHeight;

  // =====================================
  // DIMENSIONS
  // =====================================
  // Fixed width (typical responsive design breakpoint)
  // Height auto-grows based on content
  const pageWidth = data.pageWidth ?? 1280;
  const pageHeight = data.pageHeight ?? 800;
  const sectionPadding = 0;
  const sectionGap = 0;

  // =====================================
  // CHILD ORGANIZATION
  // =====================================
  // Group children by column for column-based layouts
  // Filter out special nodes like columnsSections
  const childrenByColumn = Array.from({ length: columnCount }, (_, col) =>
    (data._allNodes ?? []).filter(
      (n) =>
        n.data?._ownedByColumn === id &&
        n.data?._columnIndex === col &&
        n.type !== "columnsSection"
    )
  );

  // Get all rows sorted by order (z-index layers)
  const rowNodes = (data._allNodes ?? [])
    .filter((n) => n.type === "row" && n.parentNode === id)
    .sort((a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0));

  // =====================================
  // DYNAMIC HEIGHT CALCULATION
  // =====================================
  /**
   * Calculate height based on content
   * Minimum: pageHeight
   * Grows with: row heights and child node positions
   * Memoized to avoid recomputation on every render
   */
  const calculatedHeight = useMemo(() => {
    if (typeof computedHeightOverride === "number") {
      return Math.max(computedHeightOverride, pageHeight);
    }
    const minHeight = pageHeight;
    if (rowNodes.length === 0) {
      const layoutChildren =
        (data._allNodes ?? []).filter(
          (n: any) =>
            n.parentNode === id &&
            (n.type === "header" || n.type === "footer" || n.type === "row")
        ) || [];
      if (layoutChildren.length > 0) {
        const total = layoutChildren.reduce((acc: number, child: any) => {
          const h =
            (child.style?.height as number | undefined) ??
            (child.data?.height as number | undefined) ??
            (child.data?.rowHeight as number | undefined) ??
            (child.height as number | undefined) ??
            0;
          return acc + Math.max(h, 40);
        }, 0);
        return Math.max(minHeight, total);
      }
      return minHeight;
    }

    const rowsHeight = rowNodes.reduce((sum: number, row: any) => {
      const isOnlyRow = rowNodes.length === 1;
      if (isOnlyRow && typeof pageHeight === "number") {
        return sum + Math.max(0, pageHeight);
      }
      if (typeof row.data?.rowHeight === "number") {
        return sum + Math.max(0, row.data.rowHeight);
      }

      const rowChildren = (data._allNodes ?? []).filter(
        (n) => n.data?._rowId === row.id
      );
      const rowHeight =
        rowChildren.length > 0
          ? Math.max(
              ...rowChildren.map((child: any) => {
                const height = child.height ?? child.data?.height ?? 0;
                return (child.position?.y ?? 0) + height;
              })
            ) -
            Math.min(...rowChildren.map((child: any) => child.position?.y ?? 0))
          : row.height ?? 0;
      return sum + Math.max(0, rowHeight);
    }, 0);

    const gapsHeight = Math.max(0, rowNodes.length - 1) * sectionGap;
    const contentHeight = rowsHeight + gapsHeight + sectionPadding * 2;

    return Math.max(minHeight, contentHeight);
  }, [rowNodes, data._allNodes, pageHeight, sectionPadding, sectionGap, computedHeightOverride]);

  return (
    <div
      style={{
        background: data.backgroundColor ?? "#ffffff",
        maxWidth: pageWidth,
        width: pageWidth, // Full screen width
        minWidth: pageWidth,

        height: calculatedHeight,
        minHeight: pageHeight,

        margin: "0 auto",
        padding: 0,

        pointerEvents: "auto",
        cursor: "default",

        boxShadow: selected
          ? "0 0 0 3px #3b82f6"
          : "0 4px 20px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.2s ease, height 0.3s ease",
        overflow: "visible",

        display: "flex",
        flexDirection: "column",
      }}
    >
      {data.columns && !hasRows && (
        <ColumnsSectionNode
          id={id}
          columns={columnCount}
          gap={data.columns?.gap ?? 16}
          childrenByColumn={childrenByColumn}
          backgroundColor={data.backgroundColor}
          backgroundImage={data.backgroundImage}
          backgroundSize={data.backgroundSize}
          backgroundPosition={data.backgroundPosition}
          registerColumnRect={data._registerColumnRect!}
          viewportVersion={data._viewportVersion}
          hoverState={data._hoverState}
        />
      )}
    </div>
  );
}
