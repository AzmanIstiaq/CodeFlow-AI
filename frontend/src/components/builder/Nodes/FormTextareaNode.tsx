import { Handle, Position } from "reactflow";

export type FormTextareaNodeData = {
  placeholder: string;
  label: string;
  width: number;
  height: number;
  fontSize: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  padding: number;
  required: boolean;
  rows: number;
};

type Props = {
  data: FormTextareaNodeData;
  selected?: boolean;
};

export default function FormTextareaNode({ data, selected }: Props) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          outline: selected ? "2px solid #3b82f6" : "none",
          outlineOffset: "2px",
        }}
      >
        {data.label && (
          <label
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
            }}
          >
            {data.label}
            {data.required && <span style={{ color: "#ef4444" }}> *</span>}
          </label>
        )}
        <textarea
          placeholder={data.placeholder || "Enter your message..."}
          disabled
          rows={data.rows || 4}
          style={{
            width: data.width || 300,
            height: data.height || 100,
            fontSize: data.fontSize || 14,
            backgroundColor: data.backgroundColor || "#ffffff",
            border: `1px solid ${data.borderColor || "#d1d5db"}`,
            borderRadius: data.borderRadius || 6,
            padding: data.padding || 10,
            cursor: "not-allowed",
            opacity: 0.8,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
