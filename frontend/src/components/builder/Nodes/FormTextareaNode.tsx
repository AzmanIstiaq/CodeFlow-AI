
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
      <textarea
        placeholder={data.placeholder || "Enter your message..."}
        readOnly
        rows={data.rows || 4}
        style={{
          width: data.width || 300,
          height: data.height || 100,
          fontSize: data.fontSize || 14,
          padding: data.padding || 10,
          background: "transparent",
          border: selected ? "2px dotted #3b82f6" : "none",
          outline: "none",
          resize: "vertical",
          fontFamily: "inherit",
          cursor: "move",
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}
