import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { useInlineEdit } from "../hooks/useInlineEdit";
import { NodeResizer } from "reactflow";

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
  onUpdateText?: (text: string) => void;
};

export default function TextNode({ data, selected, id }: NodeProps<TextNodeData>) {
  const {
    isEditing,
    value,
    inputRef,
    startEditing,
    handleKeyDown,
    handleBlur,
    handleChange,
  } = useInlineEdit(data.text, (newValue) => {
    if (data.onUpdateText) {
      data.onUpdateText(newValue);
    }
  });
  const content = (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
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
        cursor: isEditing ? "text" : "grab",
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
        pointerEvents: "auto",
      }}
    >
      {isEditing ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "inherit",
            fontWeight: "inherit",
            fontSize: "inherit",
            fontFamily: "inherit",
            textAlign: data.textAlign || "left",
            lineHeight: data.lineHeight || 1.6,
            letterSpacing: `${data.letterSpacing || 0}px`,
            textDecoration: data.textDecoration || "none",
            width: "100%",
            minHeight: "44px",
            padding: 0,
            cursor: "text",
            resize: "none",
          }}
        />
      ) : data.link ? (
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
}
