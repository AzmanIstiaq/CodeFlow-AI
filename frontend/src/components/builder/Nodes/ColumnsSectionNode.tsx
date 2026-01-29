/**
 * RULE BOUNDARY
 *
 * This file must not define layout, spacing, drag, resize,
 * selection, or z-index rules.
 *
 * All such logic MUST come from frontendRules/*.
 */
/**
 * Columns Section Node
 *
 * Purpose:
 * - Render a section with grid-based columns for structured layouts.
 *
 * Role in the system:
 * - Provides column containers and registers drop target bounds.
 *
 * Key responsibilities:
 * - Create a grid with the requested column count.
 * - Register column rectangles for drag-and-drop targeting.
 * - Display hover feedback when a column is targeted.
 *
 * Important constraints and assumptions:
 * - Column rect registration runs on layout changes and viewport updates.
 * - Children are managed externally; this component renders drop zones only.
 */

import { useRef, useLayoutEffect } from "react";
import {
  COLUMN_DROPZONE_PADDING_Y,
  COLUMN_DROPZONE_PADDING_X,
  COLUMN_PLACEHOLDER_MARGIN_TOP,
} from "../../../frontendRules/layout/layoutMetrics";

// ================================
// Types
// ================================
type ColumnsSectionNodeProps = {
  id: string;
  columns: number;
  gap: number;
  childrenByColumn: any[][];
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  registerColumnRect: (
    sectionId: string,
    columnIndex: number,
    rect: DOMRect
  ) => void;
  viewportVersion?: number;
  hoverState?: {
    sectionId: string | null;
    columnIndex: number | null;
  };
};

// ================================
// Component
// ================================
/**
 * Section layout with column drop zones.
 */
export default function ColumnsSectionNode({
  id,
  columns,
  gap,
  childrenByColumn,
  backgroundColor,
  backgroundImage,
  backgroundSize,
  backgroundPosition,
  registerColumnRect,
  viewportVersion,
  hoverState,
}: ColumnsSectionNodeProps) {
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ================================
  // Column Rect Registration
  // ================================
  useLayoutEffect(() => {
    // Delegated to layout rules (single source of truth)
    requestAnimationFrame(() => {
      Object.entries(columnRefs.current).forEach(([colIndex, el]) => {
        if (!el) return;
        registerColumnRect(id, Number(colIndex), el.getBoundingClientRect());
      });
    });
  }, [columns, gap, id, registerColumnRect, viewportVersion]);

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 0,
        width: "100%",
        height: "100%",
        backgroundColor: backgroundColor || "transparent",
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
        backgroundSize: backgroundSize || "cover",
        backgroundPosition: backgroundPosition || "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {Array.from({ length: columns }).map((_, colIndex) => {
        const isHovered =
          hoverState?.sectionId === id && hoverState?.columnIndex === colIndex;

        return (
          <div
            key={colIndex}
            id={`column-${id}-${colIndex}`}
            ref={(el) => {
              columnRefs.current[colIndex] = el;
            }}
            data-column-index={colIndex}
            style={{
              position: "relative",
              zIndex: 10,
              pointerEvents: "auto",
              // DO NOT edit padding here; adjust column drop padding in layoutMetrics.ts.
              padding: `${COLUMN_DROPZONE_PADDING_Y}px ${COLUMN_DROPZONE_PADDING_X}px`,
              backgroundColor: isHovered ? "rgba(59,130,246,0.15)" : "transparent",
              border: isHovered ? "2px dashed rgba(59,130,246,0.8)" : undefined,
              transition: "all 0.2s ease",
            }}
          >
            {!childrenByColumn[colIndex]?.length && (
              <div
                style={{
                  marginTop: COLUMN_PLACEHOLDER_MARGIN_TOP,
                  textAlign: "center",
                  color: "#3b82f6",
                  opacity: 0.6,
                  fontSize: 12,
                  userSelect: "none",
                }}
              >
                Drop content here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
