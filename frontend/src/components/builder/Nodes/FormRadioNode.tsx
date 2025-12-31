import { Handle, Position } from "reactflow";

export type FormRadioNodeData = {
  label: string;
  groupName: string;
  options: string[];
  selectedValue: string;
  required: boolean;
  fontSize: number;
  radioSize: number;
  labelColor: string;
  radioColor: string;
  layout: "vertical" | "horizontal";
};

type Props = {
  data: FormRadioNodeData;
  selected?: boolean;
};

export default function FormRadioNode({ data, selected }: Props) {
  const options = data.options || ["Option 1", "Option 2", "Option 3"];
  
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
              fontSize: data.fontSize || 14,
              fontWeight: 500,
              color: data.labelColor || "#374151",
            }}
          >
            {data.label}
            {data.required && <span style={{ color: "#ef4444" }}> *</span>}
          </label>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: data.layout === "horizontal" ? "row" : "column",
            gap: data.layout === "horizontal" ? 16 : 8,
            flexWrap: "wrap",
          }}
        >
          {options.map((option, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="radio"
                name={data.groupName || "radio-group"}
                value={option}
                checked={data.selectedValue === option}
                disabled
                style={{
                  width: data.radioSize || 18,
                  height: data.radioSize || 18,
                  cursor: "not-allowed",
                  accentColor: data.radioColor || "#3b82f6",
                }}
              />
              <label
                style={{
                  fontSize: (data.fontSize || 14) - 1,
                  color: data.labelColor || "#374151",
                  cursor: "not-allowed",
                  userSelect: "none",
                }}
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
