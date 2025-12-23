import { Handle, Position } from "reactflow";

export type SectionNodeData = {
  label?: string;
  padding: number; // spacing inside section
  gap: number; // spacing between children
  align: "start" | "center";
  maxWidth: number; // content width, not section width
  backgroundColor: string;
  order: number; // section stack order
  isParentOfSelected?: boolean;
};

type Props = {
  data: SectionNodeData;
  selected?: boolean;
};

export default function SectionNode({ data, selected }: Props) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: 150,
        padding: data.padding,
        background: data.backgroundColor,
        borderRadius: 12,
        border: "1px dashed #444",
        color: "#fff",
        transition: "all 0.2s ease",
      }}
    >
      {/* INNER CONTENT WRAPPER */}
      <div
        style={{
          maxWidth: data.maxWidth,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: data.align === "center" ? "center" : "flex-start",
          gap: `${data.gap}px`,
        }}
      >
        {data.label && (
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {data.isParentOfSelected && "🔗 "}
            {data.label}
          </div>
        )}
      </div>

      {/* Handles stay invisible */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
