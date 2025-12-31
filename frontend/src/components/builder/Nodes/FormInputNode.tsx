import { Handle, Position } from "reactflow";

export type FormInputNodeData = {
  placeholder: string;
  inputType: "text" | "email" | "password" | "number" | "tel" | "url";
  label: string;
  width: number;
  fontSize: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  padding: number;
  required: boolean;
};

type Props = {
  data: FormInputNodeData;
  selected?: boolean;
};

export default function FormInputNode({ data, selected }: Props) {
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
        <input
          type={data.inputType || "text"}
          placeholder={data.placeholder || "Enter text..."}
          disabled
          style={{
            width: data.width || 300,
            fontSize: data.fontSize || 14,
            backgroundColor: data.backgroundColor || "#ffffff",
            border: `1px solid ${data.borderColor || "#d1d5db"}`,
            borderRadius: data.borderRadius || 6,
            padding: data.padding || 10,
            cursor: "not-allowed",
            opacity: 0.8,
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
