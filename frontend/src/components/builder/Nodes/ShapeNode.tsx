import { memo } from "react";
import { NodeResizer } from "reactflow";
import RadiusHandle from "../RadiusHandle";

export type ShapeNodeData = {
  shapeType: "rectangle" | "circle" | "triangle";
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius:
    | number
    | {
        topLeft?: number;
        topRight?: number;
        bottomLeft?: number;
        bottomRight?: number;
      };
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
  _onRadiusChange?: (radius: number, corner?: string) => void;
  _onRadiusStart?: () => void;
  _onRadiusEnd?: () => void;
};

type Props = {
  data: ShapeNodeData;
  selected?: boolean;
};

function ShapeNode({ data, selected }: Props) {
  const handleRadiusChange = (radius: number, corner?: string) => {
    if (data._onRadiusChange) {
      data._onRadiusChange(radius, corner);
    }
  };

  const getBorderRadius = () => {
    if (typeof data.borderRadius === "number") {
      return data.borderRadius;
    }
    const {
      topLeft = 0,
      topRight = 0,
      bottomLeft = 0,
      bottomRight = 0,
    } = data.borderRadius;
    return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
  };

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
          borderBottom: `${data.height || 100}px solid ${
            data.backgroundColor || "#3b82f6"
          }`,
        };
      default:
        return { ...baseStyle, borderRadius: getBorderRadius() };
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={50}
        keepAspectRatio={false}
        onResizeStart={(data as any)._onResizeStart}
        onResizeEnd={(data as any)._onResizeEnd}
        onResize={(data as any)._onResize}
      />
      {data.shapeType === "rectangle" && (
        <>
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
        </>
      )}
      <div style={{ ...getShapeStyle(), width: "100%", height: "100%" }} />
    </div>
  );
}

export default memo(ShapeNode);
