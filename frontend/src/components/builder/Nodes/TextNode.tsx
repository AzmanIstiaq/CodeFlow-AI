/**
 * TextNode Component
 *
 * Renders a text element on the canvas with inline editing support.
 * Supports rich text styling: font, color, size, alignment, shadow, etc.
 *
 * Features:
 * - Double-click to edit text inline
 * - Full CSS styling (font, color, alignment, shadows)
 * - Transform support (rotation, opacity)
 * - Textarea for multi-line content
 * - Handles input capture to prevent canvas interactions
 *
 * Data Props:
 * - text: Content string
 * - fontSize, color, fontWeight, fontFamily: Typography
 * - textAlign: left | center | right | justify
 * - lineHeight, letterSpacing: Line formatting
 * - opacity, rotation: Visual transforms
 * - backgroundColor, borderRadius, border: Box styling
 * - padding, width, height: Sizing
 * - textShadow: Text effect
 * - onUpdateText: Callback when text is saved
 *
 * Interactive Behavior:
 * - Double-click: Enter edit mode
 * - Escape or blur: Save changes
 * - Grab cursor in view mode, text cursor in edit mode
 *
 * Performance:
 * - Wrapped with React.memo to skip re-renders when props unchanged
 * - Inline style objects may create new refs - not optimized for render performance
 */

import React, { memo } from "react";
import { NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import { useInlineEdit } from "../hooks/useInlineEdit";

export type TextNodeData = {
  text: string;
  fontSize: number;
  color: string;
  fontWeight: number;
  fontFamily: string;
  textAlign: "left" | "center" | "right" | "justify";
  lineHeight: number;
  letterSpacing: number;
  textDecoration: string;
  link: string;
  opacity: number;
  rotation: number;
  textShadow: string;
  backgroundColor: string;
  padding: number;
  borderRadius: number;
  border: string;
  width?: number;
  height?: number;
  onUpdateText?: (text: string) => void;

  // Resize handlers injected from node operations
  _onResizeStart?: () => void;
  _onResizeEnd?: () => void;
  _onResize?: (_: any, size: { width: number; height: number }) => void;
};

function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  // =====================================
  // INLINE EDITING
  // =====================================
  // Manage edit mode state and text changes
  const {
    isEditing,
    value,
    inputRef,
    startEditing,
    handleKeyDown,
    handleBlur,
    handleChange,
  } = useInlineEdit(data.text, (newValue) => {
    if (data.onUpdateText) {
      data.onUpdateText(newValue);
    }
  });

  // =====================================
  // RENDER
  // =====================================
  // Main text container with optional textarea for editing
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 40,
        minHeight: 44,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={44}
        keepAspectRatio={false}
        onResizeStart={data._onResizeStart}
        onResize={data._onResize}
        onResizeEnd={data._onResizeEnd}
        handleStyle={{ pointerEvents: "all" }}
      />

      <div
        // Double-click to enter edit mode
        onDoubleClick={(e) => {
          e.stopPropagation();
          startEditing();
        }}
        style={{
          // Typography
          fontSize: data.fontSize || 16,
          color: data.color || "#111827",
          fontWeight: data.fontWeight || 400,
          fontFamily: data.fontFamily || "inherit",
          textAlign: data.textAlign || "left",
          lineHeight: data.lineHeight || 1.6,
          letterSpacing: `${data.letterSpacing || 0}px`,
          textDecoration: data.textDecoration || "none",
          padding: data.padding || 16,
          // Interaction
          cursor: isEditing ? "text" : "grab",
          minHeight: "44px",
          // Layout
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "100%",
          // Visual transforms
          opacity: data.opacity ?? 1,
          transform: `rotate(${data.rotation || 0}deg)`,
          textShadow: data.textShadow || "none",
          // Box styling
          backgroundColor: data.backgroundColor || "transparent",
          borderRadius: data.borderRadius || 0,
          border: data.border || "none",
          boxSizing: "border-box",
          // Selection indicator
          outline: selected ? "2px solid #3b82f6" : "none",
          outlineOffset: "2px",
          pointerEvents: "auto",
        }}
      >
        {isEditing ? (
          // Edit mode: textarea for multi-line input
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            // Prevent canvas interactions while editing
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
              textAlign: data.textAlign || "left",
              lineHeight: data.lineHeight || 1.6,
              letterSpacing: `${data.letterSpacing || 0}px`,
              textDecoration: data.textDecoration || "none",
              width: "100%",
              height: "100%",
              minHeight: "44px",
              padding: 0,
              cursor: "text",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        ) : data.link ? (
          <a
            href={data.link}
            style={{ color: "inherit", textDecoration: "inherit" }}
          >
            {data.text}
          </a>
        ) : (
          data.text
        )}
      </div>
    </div>
  );
}

export default memo(TextNode);
