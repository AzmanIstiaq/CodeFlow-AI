import { NodeResizer } from "reactflow";
import RadiusHandle from "../RadiusHandle";

export type ButtonNodeData = {
  label: string;
  href?: string;
  variant: "primary" | "secondary";
  order: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius: number | { topLeft?: number; topRight?: number; bottomLeft?: number; bottomRight?: number };
  padding: string;
  fontSize: number;
  fontWeight: number;
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
  width: number;
  _onRadiusChange?: (radius: number, corner?: string) => void;
  _onRadiusStart?: () => void;
  _onRadiusEnd?: () => void;
};

type Props = {
  data: ButtonNodeData;
  selected?: boolean;
};

export default function ButtonNode({ data, selected }: Props) {
  const defaultBg = data.variant === "secondary" ? "#374151" : "#3b82f6";
  const bg = data.backgroundColor || defaultBg;

  const handleRadiusChange = (radius: number, corner?: string) => {
    if (data._onRadiusChange) {
      data._onRadiusChange(radius, corner);
    }
  };

  const getBorderRadius = () => {
    if (data.borderRadius === undefined) {
      return 8;
    }
    if (typeof data.borderRadius === 'number') {
      return data.borderRadius;
    }
    const { topLeft = 0, topRight = 0, bottomLeft = 0, bottomRight = 0 } = data.borderRadius;
    return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
  };

  const buttonContent = (
    <button
      style={{
        width: "100%",
        height: "100%",
        padding: data.padding || "12px 24px",
        borderRadius: getBorderRadius() || 8,
        border: data.border || "none",
        cursor: "grab",
        background: bg,
        color: data.textColor || "#ffffff",
        fontWeight: data.fontWeight || 600,
        fontSize: data.fontSize || 16,
        minWidth: "120px",
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        opacity: data.opacity ?? 1,
        transform: `rotate(${data.rotation || 0}deg)`,
        boxShadow: data.boxShadow || "none",
        outlineOffset: "2px",
        boxSizing: "border-box",
      }}
    >
      {data.label}
    </button>
  );

  if (data.href) {
    return (
      <div style={{ 
        position: "relative",
        width: "100%",
        height: "100%",
      }}>
        <NodeResizer 
          isVisible={selected} 
          minWidth={120} 
          minHeight={44}
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
        <a href={data.href} style={{ textDecoration: "none", display: "block", width: "100%", height: "100%" }}>
          {buttonContent}
        </a>
      </div>
    );
  }

  return (
    <div style={{ 
      position: "relative",
      width: "100%",
      height: "100%",
    }}>
      <NodeResizer 
        isVisible={selected} 
        minWidth={120} 
        minHeight={44}
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
      {buttonContent}
    </div>
  );
}
