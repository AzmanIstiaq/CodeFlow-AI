type ButtonNodeData = {
  label: string;
  href?: string;
  variant: "primary" | "secondary";
  order: number;
};

type Props = {
  data: ButtonNodeData;
};

export default function ButtonNode({ data }: Props) {
  const bg = data.variant === "secondary" ? "#374151" : "#3b82f6";

  return (
    <button
      style={{
        padding: "10px 16px",
        borderRadius: 6,
        border: "none",
        cursor: "grab",
        background: bg,
        color: "#ffffff",
        fontWeight: 500,
      }}
    >
      {data.label}
    </button>
  );
}
