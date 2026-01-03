
export type ImageNodeData = {
  src: string;
  alt: string;
  width: number;
  height: number;
  borderRadius: number;
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
  objectFit: "cover" | "contain" | "fill" | "none";
};

type Props = {
  data: ImageNodeData;
  selected?: boolean;
};

export default function ImageNode({ data, selected }: Props) {
  return (
    <div
      style={{
        cursor: "grab",
        position: "relative",
        transform: `rotate(${data.rotation || 0}deg)`,
        opacity: data.opacity ?? 1,
      }}
    >
      <img
        src={data.src || "https://via.placeholder.com/300x200"}
        alt={data.alt || "Image"}
        style={{
          width: data.width || 300,
          height: data.height || 200,
          borderRadius: data.borderRadius || 0,
          boxShadow: data.boxShadow || "none",
          border: data.border || "none",
          objectFit: data.objectFit || "cover",
          display: "block",
          outline: selected ? "2px solid #3b82f6" : "none",
          outlineOffset: "2px",
        }}
      />
    </div>
  );
}
