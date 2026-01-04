import { NodeResizer } from "reactflow";

export type FormCheckboxNodeData = {
  label: string;
  checked: boolean;
  required: boolean;
  fontSize: number;
  checkboxSize: number;
  labelColor: string;
  checkboxColor: string;
};

type Props = {
  data: FormCheckboxNodeData;
  selected?: boolean;
};

export default function FormCheckboxNode({ data, selected }: Props) {
  return (
    <div style={{ position: "relative" }}>
      <NodeResizer 
        isVisible={selected} 
        minWidth={100} 
        minHeight={30}
        onResizeStart={(data as any)._onResizeStart}
        onResizeEnd={(data as any)._onResizeEnd}
        onResize={(data as any)._onResize}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          outline: selected ? "2px solid #3b82f6" : "none",
          outlineOffset: "2px",
        }}
      >
        <input
          type="checkbox"
          checked={data.checked || false}
          disabled
          style={{
            width: data.checkboxSize || 18,
            height: data.checkboxSize || 18,
            cursor: "not-allowed",
            accentColor: data.checkboxColor || "#3b82f6",
          }}
        />
        <label
          style={{
            fontSize: data.fontSize || 14,
            fontWeight: 500,
            color: data.labelColor || "#374151",
            cursor: "not-allowed",
            userSelect: "none",
          }}
        >
          {data.label || "Checkbox Label"}
          {data.required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
      </div>
    </div>
  );
}
