/**
 * Form Textarea Node
 *
 * Purpose:
 * - Render a multi-line textarea form field preview.
 *
 * Role in the system:
 * - Provides textarea elements for builder layouts.
 *
 * Key responsibilities:
 * - Display a read-only textarea with sizing and style cues.
 * - Provide resize handles when selected.
 *
 * Important constraints and assumptions:
 * - Textarea is read-only to avoid editing in the canvas.
 */

import { memo } from "react";
import { NodeResizer } from "reactflow";

// ================================
// Types
// ================================
export type FormTextareaNodeData = {
  placeholder: string;
  label: string;
  width: number;
  height: number;
  fontSize: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  padding: number;
  required: boolean;
  rows: number;
};

type Props = {
  data: FormTextareaNodeData;
  selected?: boolean;
};

// ================================
// Component
// ================================
/**
 * Read-only textarea node with resize handles.
 */
function FormTextareaNode({ data, selected }: Props) {
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
        minHeight={60}
        keepAspectRatio={false}
        onResizeStart={(data as any)._onResizeStart}
        onResizeEnd={(data as any)._onResizeEnd}
        onResize={(data as any)._onResize}
      />
      <textarea
        placeholder={data.placeholder || "Enter your message..."}
        readOnly
        rows={data.rows || 4}
        style={{
          width: "100%",
          height: "100%",
          fontSize: data.fontSize || 14,
          padding: data.padding || 10,
          background: "transparent",
          border: selected ? "2px dotted #3b82f6" : "none",
          outline: "none",
          resize: "none",
          fontFamily: "inherit",
          cursor: "move",
          pointerEvents: "auto",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export default memo(FormTextareaNode);
