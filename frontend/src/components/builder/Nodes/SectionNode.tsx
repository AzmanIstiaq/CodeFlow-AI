import { Handle, Position } from "reactflow";

export type SectionNodeData = {
  label?: string;
  padding: number;
  backgroundColor: string;
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
        padding: data.padding || 40,
        background: data.backgroundColor || "#111",
        minWidth: 300,
        minHeight: 150,
        borderRadius: 8,
        border: "1px dashed #444",
        color: "#fff",
        transition: "all 0.2s ease",
      }}
    >
      <strong>
        {data.isParentOfSelected && "🔗 "}
        {data.label || "Section"}
      </strong>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
