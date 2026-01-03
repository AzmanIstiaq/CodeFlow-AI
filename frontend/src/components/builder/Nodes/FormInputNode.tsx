
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
      <input
        type={data.inputType || "text"}
        placeholder={data.placeholder || "Enter text..."}
        readOnly
        style={{
          width: data.width || 300,
          fontSize: data.fontSize || 14,
          padding: data.padding || 10,
          background: "transparent",
          border: selected ? "2px dotted #3b82f6" : "none",
          outline: "none",
          fontFamily: "inherit",
          cursor: "move",
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}
