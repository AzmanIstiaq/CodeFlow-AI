import { Handle, Position } from "reactflow";

export type ContainerNodeData = {
  label: string;
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
  display: "flex" | "block";
  flexDirection: "row" | "column";
  justifyContent: "flex-start" | "center" | "flex-end" | "space-between";
  alignItems: "flex-start" | "center" | "flex-end" | "stretch";
  gap: number;
};

type Props = {
  data: ContainerNodeData;
  selected?: boolean;
};

export default function ContainerNode({ data, selected }: Props) {
  return (
    <div
      style={{
        width: data.width || 400,
        height: data.height || 300,
        backgroundColor: data.backgroundColor || "#f3f4f6",
        borderRadius: data.borderRadius || 8,
        padding: data.padding || 20,
        opacity: data.opacity ?? 1,
        transform: `rotate(${data.rotation || 0}deg)`,
        boxShadow: data.boxShadow || "0 1px 3px rgba(0,0,0,0.1)",
        border: data.border || "1px solid #e5e7eb",
        cursor: "grab",
        display: data.display || "flex",
        flexDirection: data.flexDirection || "column",
        justifyContent: data.justifyContent || "flex-start",
        alignItems: data.alignItems || "flex-start",
        gap: data.gap || 12,
        outline: selected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
        position: "relative",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
        {data.label || "Container"}
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
