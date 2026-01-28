/**
 * HeaderFooterNode
 *
 * Purpose:
 * - Render editable header/footer layout blocks that host column drop zones.
 *
 * Role in the system:
 * - Acts as a flow-aware container that measures its own height and registers
 *   column rectangles for drag/drop targeting.
 *
 * Key responsibilities:
 * - Expose a resizable area with background, padding, and border styling.
 * - Register column bounds for drop zones.
 * - Report measured height to keep vertical stacking accurate.
 *
 * Important constraints and assumptions:
 * - Columns default to a single column but can host multiple children via
 *   column ownership metadata.
 * - Pointer events stay enabled so the node can be selected and resized.
 */

import { useLayoutEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { NodeResizer } from "reactflow";

type HeaderFooterNodeData = {
  columns?: {
    count: number;
    gap: number;
  };
  height?: number;
  padding?: number;
  backgroundColor?: string;
  border?: string;
  borderRadius?:
    | number
    | {
        topLeft?: number;
        topRight?: number;
        bottomLeft?: number;
        bottomRight?: number;
      };

  _allNodes?: any[];
  _registerColumnRect?: (
    ownerId: string,
    columnIndex: number,
    rect: DOMRect
  ) => void;
  _viewportVersion?: number;
  _hoverState?: {
    sectionId: string | null;
    columnIndex: number | null;
  };
  _onMeasure?: (id: string, height: number) => void;
  _onColumnClick?: (event: MouseEvent, ownerId: string, columnIndex: number) => void;
  _onResizeStart?: () => void;
  _onResizeEnd?: () => void;
  _onResize?: (event: any, params: any) => void;
};

type Props = {
  id: string;
  data: HeaderFooterNodeData;
  selected?: boolean;
};

export default function HeaderFooterNode({ id, data, selected }: Props) {
  const columns = data.columns?.count ?? 1;
  const gap = data.columns?.gap ?? 16;
  const padding = data.padding ?? 24;

  const blockRef = useRef<HTMLDivElement | null>(null);
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lastHeightRef = useRef<number>(0);

  // Register column bounds so drop logic can target them.
  useLayoutEffect(() => {
    if (!data._registerColumnRect) return;
    requestAnimationFrame(() => {
      Object.entries(columnRefs.current).forEach(([colIndex, el]) => {
        if (!el) return;
        data._registerColumnRect!(id, Number(colIndex), el.getBoundingClientRect());
      });
    });
  }, [columns, gap, id, data._registerColumnRect, data._viewportVersion]);

  // Measure height to keep the flow layout accurate.
  // Only report dynamic height when no explicit height is set.
  useLayoutEffect(() => {
    if (!blockRef.current || !data._onMeasure) return;
    if (typeof data.height === "number") return;

    const height = blockRef.current.offsetHeight;
    if (height) {
      data._onMeasure(id, height);
      requestAnimationFrame(() => data._onMeasure!(id, height));
    }
  }, [columns, gap, padding]);


  return (
    <div
      ref={blockRef}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gap ?? 0,
        width: "100%",
        height: typeof data.height === "number" ? data.height : "auto",
        minHeight: 50,
        padding,
        backgroundColor: data.backgroundColor ?? "#ffffff",
        borderRadius: typeof data.borderRadius === 'object' 
          ? `${data.borderRadius.topLeft ?? 0}px ${data.borderRadius.topRight ?? 0}px ${data.borderRadius.bottomRight ?? 0}px ${data.borderRadius.bottomLeft ?? 0}px`
          : `${data.borderRadius ?? 0}px`,
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      <NodeResizer
        isVisible={!!selected}
        minWidth={200}
        minHeight={50}
        keepAspectRatio={false}
        color="#3b82f6"
        onResizeStart={data._onResizeStart}
        onResizeEnd={data._onResizeEnd}
        onResize={(event, params) => {
          // Call the custom resize handler if available
          if (data._onResize) {
            data._onResize(event, params);
          }
        }}
      />
      {Array.from({ length: columns }).map((_, colIndex) => {
        const isHovered =
          data._hoverState?.sectionId === id &&
          data._hoverState?.columnIndex === colIndex;
        return (
          <div
            key={colIndex}
            id={`column-${id}-${colIndex}`}
            ref={(el) => {
              columnRefs.current[colIndex] = el;
            }}
            data-column-index={colIndex}
            onClick={(event) => data._onColumnClick?.(event, id, colIndex)}
            style={{
              position: "relative",
              minHeight: 32,
              pointerEvents: "auto",
              backgroundColor: isHovered ? "rgba(59,130,246,0.08)" : "transparent",
              border: isHovered ? "2px dashed rgba(59,130,246,0.8)" : "1px dashed transparent",
              transition: "all 0.2s ease",
            }}
          >
            {!(
              data._allNodes ?? []
            ).some(
              (n) =>
                n.data?._ownedByColumn === id &&
                (n.data?._columnIndex ?? n.data?.columnIndex) === colIndex
            ) && (
              <div
                style={{
                  textAlign: "center",
                  color: "#3b82f6",
                  opacity: 0.7,
                  fontSize: 12,
                  userSelect: "none",
                  marginTop: 8,
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
