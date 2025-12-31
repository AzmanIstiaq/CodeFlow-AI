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
};

type Props = {
  data: ButtonNodeData;
  selected?: boolean;
};

export default function ButtonNode({ data, selected }: Props) {
  const defaultBg = data.variant === "secondary" ? "#374151" : "#3b82f6";
  const bg = data.backgroundColor || defaultBg;

  const buttonContent = (
    <button
      style={{
        padding: data.padding || "12px 24px",
        borderRadius: data.borderRadius ?? 8,
        border: data.border || "none",
        cursor: "grab",
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
      }}
    >
      {data.label}
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
