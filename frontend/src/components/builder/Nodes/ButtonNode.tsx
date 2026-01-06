import { useInlineEdit } from "../hooks/useInlineEdit";
import type { NodeProps } from "reactflow";

export type ButtonNodeData = {
  label: string;
  href?: string;
  variant: "primary" | "secondary";
  order: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius: number;
  padding: string;
  fontSize: number;
  fontWeight: number;
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
  width: number;
  onUpdateText?: (text: string) => void;
};

export default function ButtonNode({ data, selected, id }: NodeProps<ButtonNodeData>) {
  const defaultBg = data.variant === "secondary" ? "#374151" : "#3b82f6";
  const bg = data.backgroundColor || defaultBg;

  const {
    isEditing,
    value,
    inputRef,
    startEditing,
    handleKeyDown,
    handleBlur,
    handleChange,
  } = useInlineEdit(data.label, (newValue) => {
    if (data.onUpdateText) {
      data.onUpdateText(newValue);
    }
  });

  const buttonContent = (
    <button
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
      style={{
        padding: data.padding || "12px 24px",
        borderRadius: data.borderRadius ?? 8,
        border: data.border || "none",
        cursor: isEditing ? "text" : "grab",
        background: bg,
        color: data.textColor || "#ffffff",
        fontWeight: data.fontWeight || 600,
        fontSize: data.fontSize || 16,
        minWidth: "120px",
        width: data.width || "auto",
        height: "44px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        opacity: data.opacity ?? 1,
        transform: `rotate(${data.rotation || 0}deg)`,
        boxShadow: data.boxShadow || "none",
        outline: selected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
        pointerEvents: "auto",
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
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
            textAlign: "center",
            width: "100%",
            padding: 0,
            cursor: "text",
          }}
        />
      ) : (
        data.label
      )}
    </button>
  );

  if (data.href) {
    return (
      <a href={data.href} style={{ textDecoration: "none" }}>
        {buttonContent}
      </a>
    );
  }

  return buttonContent;
}
