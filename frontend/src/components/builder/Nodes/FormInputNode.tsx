import { NodeResizer } from "reactflow";

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
    <div style={{ 
      position: "relative",
      width: "100%",
      height: "100%",
    }}>
      <NodeResizer 
        isVisible={selected} 
        minWidth={100} 
        minHeight={30}
        keepAspectRatio={false}
        onResizeStart={(data as any)._onResizeStart}
        onResizeEnd={(data as any)._onResizeEnd}
        onResize={(data as any)._onResize}
      />
      <input
        type={data.inputType || "text"}
        placeholder={data.placeholder || "Enter text..."}
        readOnly
        style={{
          width: "100%",
          height: "100%",
          fontSize: data.fontSize || 14,
          padding: data.padding || 10,
          background: "transparent",
          border: selected ? "2px dotted #3b82f6" : "none",
          outline: "none",
          fontFamily: "inherit",
          cursor: "move",
          pointerEvents: "auto",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
