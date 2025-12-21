import { Handle, Position } from "reactflow";

export type TextNodeData = {
  text: string;
  fontSize: number;
  color: string;
};

type Props = {
  data: TextNodeData;
};

export default function TextNode({ data }: Props) {
  return (
    <div
      style={{
        fontSize: data.fontSize,
        color: data.color,
        padding: "8px 12px",
        cursor: "text",
      }}
    >
      {data.text}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
