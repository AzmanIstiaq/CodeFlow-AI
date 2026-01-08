import { NodeResizer } from "reactflow";
import RadiusHandle from "../RadiusHandle";

export type ImageNodeData = {
  src: string;
  alt: string;
  width: number;
  height: number;
  borderRadius: number | { topLeft?: number; topRight?: number; bottomLeft?: number; bottomRight?: number };
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
  objectFit: "cover" | "contain" | "fill" | "none";
  _onRadiusChange?: (radius: number, corner?: string) => void;
  _onRadiusStart?: () => void;
  _onRadiusEnd?: () => void;
};

type Props = {
  data: ImageNodeData;
  selected?: boolean;
};

export default function ImageNode({ data, selected }: Props) {
  const handleRadiusChange = (radius: number, corner?: string) => {
    if (data._onRadiusChange) {
      data._onRadiusChange(radius, corner);
    }
  };

  const getBorderRadius = () => {
    if (typeof data.borderRadius === 'number') {
      return data.borderRadius;
    }
    const { topLeft = 0, topRight = 0, bottomLeft = 0, bottomRight = 0 } = data.borderRadius;
    return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
  };

  return (
    <div style={{ 
      position: "relative",
      width: "100%",
      height: "100%",
    }}>
      <NodeResizer 
        isVisible={selected} 
        minWidth={50} 
        minHeight={50}
        keepAspectRatio={false}
        onResizeStart={(data as any)._onResizeStart}
        onResizeEnd={(data as any)._onResizeEnd}
        onResize={(data as any)._onResize}
      />
      <RadiusHandle
        borderRadius={data.borderRadius || 0}
        onRadiusChange={handleRadiusChange}
        isVisible={selected || false}
        position="top-left"
        onDragStart={data._onRadiusStart}
        onDragEnd={data._onRadiusEnd}
      />
      <RadiusHandle
        borderRadius={data.borderRadius || 0}
        onRadiusChange={handleRadiusChange}
        isVisible={selected || false}
        position="top-right"
        onDragStart={data._onRadiusStart}
        onDragEnd={data._onRadiusEnd}
      />
      <RadiusHandle
        borderRadius={data.borderRadius || 0}
        onRadiusChange={handleRadiusChange}
        isVisible={selected || false}
        position="bottom-left"
        onDragStart={data._onRadiusStart}
        onDragEnd={data._onRadiusEnd}
      />
      <RadiusHandle
        borderRadius={data.borderRadius || 0}
        onRadiusChange={handleRadiusChange}
        isVisible={selected || false}
        position="bottom-right"
        onDragStart={data._onRadiusStart}
        onDragEnd={data._onRadiusEnd}
      />
      <img
        src={data.src}
        alt={data.alt}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: getBorderRadius(),
          boxShadow: data.boxShadow || "none",
          border: data.border || "none",
          objectFit: data.objectFit || "cover",
          display: "block",
          outline: selected ? "2px solid #3b82f6" : "none",
          outlineOffset: "2px",
          opacity: data.opacity ?? 1,
          transform: `rotate(${data.rotation || 0}deg)`,
        }}
      />
    </div>
  );
}
