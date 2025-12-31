import { Handle, Position } from "reactflow";

export type ShapeNodeData = {
  shapeType: "rectangle" | "circle" | "triangle";
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius: number;
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
};

type Props = {
  data: ShapeNodeData;
  selected?: boolean;
};

export default function ShapeNode({ data, selected }: Props) {
  const getShapeStyle = () => {
    const baseStyle = {
      width: data.width || 100,
      height: data.height || 100,
      backgroundColor: data.backgroundColor || "#3b82f6",
      opacity: data.opacity ?? 1,
      transform: `rotate(${data.rotation || 0}deg)`,
      boxShadow: data.boxShadow || "none",
      border: data.border || "none",
      cursor: "grab",
      outline: selected ? "2px solid #3b82f6" : "none",
      outlineOffset: "2px",
    };

    switch (data.shapeType) {
      case "circle":
        return { ...baseStyle, borderRadius: "50%" };
      case "triangle":
        return {
          ...baseStyle,
          width: 0,
          height: 0,
          backgroundColor: "transparent",
          borderLeft: `${(data.width || 100) / 2}px solid transparent`,
          borderRight: `${(data.width || 100) / 2}px solid transparent`,
          borderBottom: `${data.height || 100}px solid ${data.backgroundColor || "#3b82f6"}`,
        };
      default:
        return { ...baseStyle, borderRadius: data.borderRadius || 0 };
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={getShapeStyle()} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
