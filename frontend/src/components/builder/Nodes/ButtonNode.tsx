/**
 * ButtonNode Component
 *
 * Renders an interactive button element on the canvas with full styling support.
 * Features inline editing of button text via double-click.
 *
 * Features:
 * - Double-click to edit button text
 * - Optional hyperlink (href) support
 * - Full style customization: colors, size, weight, shadows, radius
 * - Per-corner border radius handles when selected
 * - Resizable with minimum dimensions (120x44px)
 * - Variant support: "primary" (blue) or "secondary" (gray) button styles
 * - Transformation support: rotation, opacity, shadows
 *
 * Data Props:
 * - label: Button text content (editable)
 * - href?: Optional URL for link button
 * - variant: Button style variant ("primary" | "secondary")
 * - backgroundColor/textColor: Custom colors
 * - borderRadius: Uniform or per-corner (topLeft, topRight, bottomLeft, bottomRight)
 * - padding: Button padding (CSS string, default "12px 24px")
 * - fontSize: Text size in pixels
 * - fontWeight: Text weight (100-900)
 * - opacity: Transparency (0-1)
 * - rotation: Rotation in degrees
 * - boxShadow: Custom shadow CSS
 * - border: Custom border CSS
 *
 * Interaction:
 * - Double-click: Enable text editing
 * - Drag edges: Resize (min 120x44)
 * - Drag corner handles (when selected): Adjust border radius per corner
 * - Click: Select node
 * - ESC while editing: Cancel text edit
 *
 * Performance:
 * - Wrapped in React.memo to prevent unnecessary re-renders
 * - useInlineEdit hook manages text editing lifecycle
 * - NodeResizer handles resize operations efficiently
 */

import { memo } from "react";
import { useInlineEdit } from "../hooks/useInlineEdit";
import type { NodeProps } from "reactflow";
import { NodeResizer } from "reactflow";
import RadiusHandle from "../RadiusHandle";

export type ButtonNodeData = {
  label: string;
  href?: string;
  variant: "primary" | "secondary";
  order: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius:
    | number
    | {
        topLeft?: number;
        topRight?: number;
        bottomLeft?: number;
        bottomRight?: number;
      };
  padding: string;
  fontSize: number;
  fontWeight: number;
  opacity: number;
  rotation: number;
  boxShadow: string;
  border: string;
  width: number;
  onUpdateText?: (text: string) => void;
  _onRadiusChange?: (radius: number, corner?: string) => void;
  _onRadiusStart?: () => void;
  _onRadiusEnd?: () => void;
};

function ButtonNode({ data, selected }: NodeProps<ButtonNodeData>) {
  // =====================================
  // STYLING & COLORS
  // =====================================
  // Determine button background based on variant or custom override
  const defaultBg = data.variant === "secondary" ? "#374151" : "#3b82f6";
  const bg = data.backgroundColor || defaultBg;

  // =====================================
  // INLINE EDITING
  // =====================================
  // Setup text editing for button label
  const {
    isEditing,
    value,
    inputRef,
    startEditing,
    handleKeyDown,
    handleBlur,
    handleChange,
  } = useInlineEdit(data.label, (newValue) => {
    if (data.onUpdateText) {
      data.onUpdateText(newValue);
    }
  });

  // =====================================
  // BORDER RADIUS HANDLING
  // =====================================
  const handleRadiusChange = (radius: number, corner?: string) => {
    if (data._onRadiusChange) {
      data._onRadiusChange(radius, corner);
    }
  };

  /**
   * Get border radius value for button element
   * Returns:
   * - number if uniform radius (convert to CSS string)
   * - string if per-corner radius with proper format
   */
  const getBorderRadius = () => {
    if (data.borderRadius === undefined) {
      return 8;
    }
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

  // =====================================
  // BUTTON CONTENT (SHARED BETWEEN LINK & NON-LINK)
  // =====================================
  /**
   * Main button element with all styling
   * Shows input field when editing, label text otherwise
   */
  const buttonContent = (
    <button
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
      style={{
        width: "100%",
        height: "100%",
        padding: data.padding || "12px 24px",
        borderRadius: getBorderRadius(),
        border: data.border || "none",
        cursor: isEditing ? "text" : "grab",
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
        pointerEvents: "auto",
        boxSizing: "border-box",
      }}
    >
      {isEditing ? (
        // Edit mode: transparent input field overlaid on button
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "inherit",
            fontWeight: "inherit",
            fontSize: "inherit",
            fontFamily: "inherit",
            textAlign: "center",
            width: "100%",
            padding: 0,
            cursor: "text",
          }}
        />
      ) : (
        // Display mode: show button label
        data.label
      )}
    </button>
  );

  // =====================================
  // RENDER
  // =====================================
  // If button has href, wrap in anchor tag
  if (data.href) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Resizable edge handles */}
        <NodeResizer
          isVisible={selected}
          minWidth={120}
          minHeight={44}
          keepAspectRatio={false}
        />
        {/* Border radius corner handles when selected */}
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
        {/* Wrap button in anchor if href is present */}
        <a
          href={data.href}
          style={{
            textDecoration: "none",
            display: "block",
            width: "100%",
            height: "100%",
          }}
        >
          {buttonContent}
        </a>
      </div>
    );
  }

  // Non-link button (regular button element)
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Resizable edge handles */}
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={44}
        keepAspectRatio={false}
        onResizeStart={(data as any)._onResizeStart}
        onResizeEnd={(data as any)._onResizeEnd}
        onResize={(data as any)._onResize}
      />
      {/* Border radius corner handles when selected */}
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

export default memo(ButtonNode);
