import { type NodeProps } from "reactflow";
import { useMemo } from "react";
import ColumnsSectionNode from "./ColumnsSectionNode";

export type SectionNodeData = {
  label?: string;
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

  // 🔑 Group children by column index
  const childrenByColumn = Array.from({ length: columnCount }, (_, col) =>
    (data._allNodes ?? []).filter(
      (n) =>
        n.data?._ownedByColumn === id &&
        n.data?._columnIndex === col &&
        n.type !== "columnsSection"
    )
  );

  // Calculate dynamic height based on child nodes - only grow when needed
  // Memoize based on child node count to prevent recalculation during drag
  const childNodes = (data._allNodes ?? []).filter(
    (n) => n.data?._ownedByColumn === id
  );
  
  const calculatedHeight = useMemo(() => {
    const minHeight = 720; // Full screen height
    let height = minHeight;
    
    if (childNodes.length > 0) {
      // Get the lowest node position
      const maxY = Math.max(...childNodes.map((n: any) => n.position.y));
      // Calculate exact height needed: node position + node height (44px for buttons/text)
      const requiredHeight = maxY + 44;
      
      // Only grow if content exceeds minimum height, use exact required height
      if (requiredHeight > minHeight) {
        height = requiredHeight;
      }
    }
    
    return height;
  }, [childNodes.length, id]);

  return (
    <div
      style={{
        background: data.backgroundColor ?? "#ffffff",
        width: 1280, // Full screen width
        height: calculatedHeight,
        margin: "0 auto",
        padding: 0,
        borderRadius: 8,
        pointerEvents: "auto",
        cursor: "pointer",
        boxShadow: selected
          ? "0 0 0 3px #3b82f6"
          : "0 4px 20px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.2s ease, height 0.3s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >

      {data.columns && (
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
