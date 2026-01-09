/**
 * Form Input Node
 *
 * Purpose:
 * - Render a single-line form input with editable label and placeholder.
 *
 * Role in the system:
 * - Provides form field elements for builder layouts.
 *
 * Key responsibilities:
 * - Support inline editing for the label and placeholder text.
 * - Render a styled input with required indicator.
 * - Provide resize handles and connection handles.
 *
 * Important constraints and assumptions:
 * - Placeholder editing disables the input for consistent editing UX.
 * - Visual selection state is shown via a dotted border.
 */

import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { useInlineEdit } from "../hooks/useInlineEdit";
import { memo } from "react";
import { NodeResizer } from "reactflow";

// ================================
// Types
// ================================
export type FormInputNodeData = {
  placeholder: string;
  inputType: "text" | "email" | "password" | "number" | "tel" | "url";
  label: string;
  width: number;
  fontSize: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  padding: number;
  required: boolean;
  onUpdateText?: (text: string) => void;
  onUpdateLabel?: (text: string) => void;
};

// ================================
// Component
// ================================
/**
 * Form input node with inline-editable label and placeholder.
 */
function FormInputNode({ data, selected }: NodeProps<FormInputNodeData>) {
  // ================================
  // Inline Editing (Label)
  // ================================
  const {
    isEditing: isEditingLabel,
    value: labelValue,
    inputRef: labelInputRef,
    startEditing: startEditingLabel,
    handleKeyDown: handleLabelKeyDown,
    handleBlur: handleLabelBlur,
    handleChange: handleLabelChange,
  } = useInlineEdit(data.label, (newValue) => {
    if (data.onUpdateLabel) {
      data.onUpdateLabel(newValue);
    }
  });

  // ================================
  // Inline Editing (Placeholder)
  // ================================
  const {
    isEditing: isEditingPlaceholder,
    value: placeholderValue,
    inputRef: placeholderInputRef,
    startEditing: startEditingPlaceholder,
    handleKeyDown: handlePlaceholderKeyDown,
    handleBlur: handlePlaceholderBlur,
    handleChange: handlePlaceholderChange,
  } = useInlineEdit(data.placeholder, (newValue) => {
    if (data.onUpdateText) {
      data.onUpdateText(newValue);
    }
  });

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
        minHeight={30}
        keepAspectRatio={false}
        onResizeStart={(data as any)._onResizeStart}
        onResizeEnd={(data as any)._onResizeEnd}
        onResize={(data as any)._onResize}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "4px",
          background: selected ? "rgba(59, 130, 246, 0.1)" : "transparent",
          border: selected ? "2px dotted #3b82f6" : "none",
          outline: "none",
          fontFamily: "inherit",
          cursor: "move",
          pointerEvents: "auto",
          boxSizing: "border-box",
        }}
      >
        {data.label && (
          <label
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEditingLabel();
            }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
              cursor: isEditingLabel ? "text" : "grab",
            }}
          >
            {isEditingLabel ? (
              <input
                ref={labelInputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={labelValue}
                onChange={handleLabelChange}
                onKeyDown={handleLabelKeyDown}
                onBlur={handleLabelBlur}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  background: "transparent",
                  border: "1px solid #3b82f6",
                  outline: "none",
                  color: "inherit",
                  fontWeight: "inherit",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  padding: "2px 4px",
                  borderRadius: 4,
                  cursor: "text",
                }}
              />
            ) : (
              data.label
            )}
            {data.required && <span style={{ color: "#ef4444" }}> *</span>}
          </label>
        )}
        <input
          type={data.inputType || "text"}
          placeholder={
            isEditingPlaceholder
              ? placeholderValue
              : data.placeholder || "Enter text..."
          }
          disabled={!isEditingPlaceholder}
          value={isEditingPlaceholder ? placeholderValue : ""}
          onChange={isEditingPlaceholder ? handlePlaceholderChange : undefined}
          onKeyDown={
            isEditingPlaceholder ? handlePlaceholderKeyDown : undefined
          }
          onBlur={isEditingPlaceholder ? handlePlaceholderBlur : undefined}
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditingPlaceholder();
          }}
          onClick={(e) => isEditingPlaceholder && e.stopPropagation()}
          onMouseDown={(e) => isEditingPlaceholder && e.stopPropagation()}
          ref={
            isEditingPlaceholder
              ? (placeholderInputRef as React.RefObject<HTMLInputElement>)
              : undefined
          }
          style={{
            width: data.width || 300,
            fontSize: data.fontSize || 14,
            backgroundColor: data.backgroundColor || "#ffffff",
            border: `1px solid ${
              isEditingPlaceholder ? "#3b82f6" : data.borderColor || "#d1d5db"
            }`,
            borderRadius: data.borderRadius || 6,
            padding: data.padding || 10,
            cursor: isEditingPlaceholder ? "text" : "not-allowed",
            opacity: isEditingPlaceholder ? 1 : 0.8,
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}

export default memo(FormInputNode);
