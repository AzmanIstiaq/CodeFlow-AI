/**
 * Image Node
 *
 * Purpose:
 * - Render an image element with resize and border radius controls.
 *
 * Role in the system:
 * - Provides visual image content for builder layouts.
 *
 * Key responsibilities:
 * - Display the image with sizing, border, and transform styles.
 * - Offer resize handles and per-corner radius controls when selected.
 *
 * Important constraints and assumptions:
 * - Border radius can be uniform or per-corner.
 * - NodeResizer events are forwarded through data hooks when present.
 */

import { memo } from "react";
import { NodeResizer } from "reactflow";
import RadiusHandle from "../RadiusHandle";

// ================================
// Types
// ================================
export type ImageNodeData = {
  src: string;
  alt: string;
  width: number;
  height: number;
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
  objectFit: "cover" | "contain" | "fill" | "none";
  _onRadiusChange?: (radius: number, corner?: string) => void;
  _onRadiusStart?: () => void;
  _onRadiusEnd?: () => void;
};

type Props = {
  data: ImageNodeData;
  selected?: boolean;
};

// ================================
// Component
// ================================
/**
 * Resizable image node with optional per-corner border radius.
 */
function ImageNode({ data, selected }: Props) {
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

export default memo(ImageNode);
