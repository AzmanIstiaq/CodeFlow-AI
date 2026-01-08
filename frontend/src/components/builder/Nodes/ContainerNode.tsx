import { memo } from "react";
import { NodeResizer } from "reactflow";
import RadiusHandle from "../RadiusHandle";

export type ContainerNodeData = {
  label: string;
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
  padding: number;
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
  display: "flex" | "block";
  flexDirection: "row" | "column";
  justifyContent: "flex-start" | "center" | "flex-end" | "space-between";
  alignItems: "flex-start" | "center" | "flex-end" | "stretch";
  gap: number;
  _onRadiusChange?: (radius: number, corner?: string) => void;
  _onRadiusStart?: () => void;
  _onRadiusEnd?: () => void;
};

type Props = {
  data: ContainerNodeData;
  selected?: boolean;
};

function ContainerNode({ data, selected }: Props) {
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
        minWidth={100}
        minHeight={100}
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
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: data.backgroundColor || "#f3f4f6",
          borderRadius: getBorderRadius(),
          padding: data.padding || 20,
          opacity: data.opacity ?? 1,
          transform: `rotate(${data.rotation || 0}deg)`,
          boxShadow: data.boxShadow || "0 1px 3px rgba(0,0,0,0.1)",
          border: data.border || "1px solid #e5e7eb",
          cursor: "grab",
          display: data.display || "flex",
          flexDirection: data.flexDirection || "column",
          justifyContent: data.justifyContent || "flex-start",
          alignItems: data.alignItems || "flex-start",
          gap: data.gap || 12,
          outlineOffset: "2px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
          {data.label || "Container"}
        </div>
      </div>
    </div>
  );
}

export default memo(ContainerNode);
