import { Handle, Position, type NodeProps } from "reactflow";
import ColumnsSectionNode from "./ColumnsSectionNode";

export type SectionNodeData = {
  label?: string;
  padding: number;
  gap: number;
  align: "start" | "center";
  maxWidth: number;
  backgroundColor: string;
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

  return (
    <div
      style={{
        background: data.backgroundColor ?? "#ffffff",
        width: data.maxWidth || 1200,
        minHeight: "80vh",
        margin: "0 auto",
        padding: data.padding ?? 64,

        pointerEvents: "none",
        boxShadow: selected
          ? "0 0 0 2px #3b82f6"
          : "0 8px 30px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Header */}
      {data.label && (
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 16,
            userSelect: "none",
          }}
        >
          {data.isParentOfSelected && "🔗 "}
          {data.label}
        </div>
      )}

      {/* Content */}
      {data.columns ? (
        <ColumnsSectionNode
          id={id}
          columns={data.columns.count}
          gap={data.columns.gap}
          childrenByColumn={childrenByColumn}
          registerColumnRect={data._registerColumnRect!}
          viewportVersion={data._viewportVersion}
        />
      ) : (
        <div
          style={{
            border: "1.5px dashed #3b82f6",
            borderRadius: 8,
            padding: 24,
            textAlign: "center",
            color: "#3b82f6",
            opacity: 0.6,
          }}
        >
          Drop content here
        </div>
      )}

      {/* ReactFlow handles (kept invisible) */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
