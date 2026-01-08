import { memo } from "react";
import { NodeResizer } from "reactflow";

export type FormSelectNodeData = {
  label: string;
  placeholder: string;
  options: string[];
  selectedValue: string;
  required: boolean;
  width: number;
  fontSize: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  labelColor: string;
};

type Props = {
  data: FormSelectNodeData;
  selected?: boolean;
};

function FormSelectNode({ data, selected }: Props) {
  const options = data.options || ["Option 1", "Option 2", "Option 3"];

  return (
    <div style={{ position: "relative" }}>
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={40}
        onResizeStart={(data as any)._onResizeStart}
        onResizeEnd={(data as any)._onResizeEnd}
        onResize={(data as any)._onResize}
      />
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
              color: data.labelColor || "#374151",
            }}
          >
            {data.label}
            {data.required && <span style={{ color: "#ef4444" }}> *</span>}
          </label>
        )}
        <select
          disabled
          style={{
            width: data.width || 300,
            fontSize: data.fontSize || 14,
            backgroundColor: data.backgroundColor || "#ffffff",
            border: `1px solid ${data.borderColor || "#d1d5db"}`,
            borderRadius: data.borderRadius || 6,
            padding: "10px 12px",
            cursor: "not-allowed",
            opacity: 0.8,
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: 36,
          }}
        >
          <option value="">{data.placeholder || "Select an option..."}</option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default memo(FormSelectNode);
