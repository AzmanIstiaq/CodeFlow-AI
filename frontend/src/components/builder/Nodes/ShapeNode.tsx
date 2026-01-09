/**
 * Shape Node
 *
 * Purpose:
 * - Render basic geometric shapes with styling and resize controls.
 *
 * Role in the system:
 * - Provides visual primitives for builder layouts.
 *
 * Key responsibilities:
 * - Apply shape-specific styling for rectangle, circle, and triangle.
 * - Offer resize handles and optional corner radius controls for rectangles.
 *
 * Important constraints and assumptions:
 * - Triangle shapes are rendered via borders with zero width/height.
 * - Border radius controls apply only to rectangular shapes.
 */

import { memo } from "react";
import { NodeResizer } from "reactflow";
import RadiusHandle from "../RadiusHandle";

// ================================
// Types
// ================================
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

// ================================
// Component
// ================================
/**
 * Resizable shape node with optional per-corner radius.
 */
function ShapeNode({ data, selected }: Props) {
  // ================================
  // Border Radius Handling
  // ================================
  const handleRadiusChange = (radius: number, corner?: string) => {
    if (data._onRadiusChange) {
      data._onRadiusChange(radius, corner);
    }
  };

  /**
   * Normalize border radius into a CSS-friendly value.
   */
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

  /**
   * Build style rules for the selected shape type.
   */
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
