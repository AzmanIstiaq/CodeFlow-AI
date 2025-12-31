import { Handle, Position } from "reactflow";

export type TextNodeData = {
  text: string;
  fontSize: number;
  color: string;
  fontWeight: number;
  fontFamily: string;
  textAlign: "left" | "center" | "right" | "justify";
  lineHeight: number;
  letterSpacing: number;
  textDecoration: string;
  link: string;
  opacity: number;
  rotation: number;
  textShadow: string;
  backgroundColor: string;
  padding: number;
  borderRadius: number;
  border: string;
  width: number;
};

type Props = {
  data: TextNodeData;
};

type PropsWithSelected = Props & { selected?: boolean };

export default function TextNode({ data, selected }: PropsWithSelected) {
  const content = (
    <div
      style={{
        fontSize: data.fontSize || 16,
        color: data.color,
        fontWeight: data.fontWeight || 400,
        fontFamily: data.fontFamily || "inherit",
        textAlign: data.textAlign || "left",
        lineHeight: data.lineHeight || 1.6,
        letterSpacing: `${data.letterSpacing || 0}px`,
        textDecoration: data.textDecoration || "none",
        padding: data.padding || 16,
        cursor: "grab",
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        opacity: data.opacity ?? 1,
        transform: `rotate(${data.rotation || 0}deg)`,
        textShadow: data.textShadow || "none",
        backgroundColor: data.backgroundColor || "transparent",
        borderRadius: data.borderRadius || 0,
        border: data.border || "none",
        width: data.width || "auto",
        outline: selected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
      }}
    >
      {data.link ? (
        <a href={data.link} style={{ color: "inherit", textDecoration: "inherit" }}>
          {data.text}
        </a>
      ) : (
        data.text
      )}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
  
  return content;
}
