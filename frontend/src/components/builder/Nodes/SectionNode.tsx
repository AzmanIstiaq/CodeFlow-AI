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
  const columnCount = data.columns?.count ?? 0;
  const hasRows = (data._allNodes ?? []).some(
    (n) => n.type === "row" && n.parentNode === id
  );

  const pageWidth = data.pageWidth ?? 1280;
  const pageHeight = data.pageHeight ?? 800;
  const sectionPadding = 0;
  const sectionGap = 0;

  // 🔑 Group children by column index
  const childrenByColumn = Array.from({ length: columnCount }, (_, col) =>
    (data._allNodes ?? []).filter(
      (n) =>
        n.data?._ownedByColumn === id &&
        n.data?._columnIndex === col &&
        n.type !== "columnsSection"
    )
  );

  const rowNodes = (data._allNodes ?? [])
    .filter((n) => n.type === "row" && n.parentNode === id)
    .sort((a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0));

  // Calculate dynamic height based on rows - only grow when needed
  const calculatedHeight = useMemo(() => {
    const minHeight = pageHeight;
    if (rowNodes.length === 0) return minHeight;

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
            ) - Math.min(...rowChildren.map((child: any) => child.position?.y ?? 0))
          : row.height ?? 0;
      return sum + Math.max(0, rowHeight);
    }, 0);

    const gapsHeight = Math.max(0, rowNodes.length - 1) * sectionGap;
    const contentHeight = rowsHeight + gapsHeight + sectionPadding * 2;

    return Math.max(minHeight, contentHeight);
  }, [rowNodes, data._allNodes, pageHeight, sectionPadding, sectionGap]);


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
        overflow: "hidden",
        
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
