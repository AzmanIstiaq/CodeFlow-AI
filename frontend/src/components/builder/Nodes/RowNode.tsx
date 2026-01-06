import { useRef, useLayoutEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { type NodeProps } from "reactflow";

export type RowNodeData = {
  columns?: {
    count: number;
    gap: number;
  };
  rowHeight?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;

  _allNodes?: any[];
  _registerColumnRect?: (
    rowId: string,
    columnIndex: number,
    rect: DOMRect
  ) => void;
  _viewportVersion?: number;
  _hoverState?: {
    sectionId: string | null;
    columnIndex: number | null;
  };
  _onRowMeasure?: (rowId: string, height: number) => void;
  _onColumnClick?: (event: ReactMouseEvent, rowId: string, columnIndex: number) => void;
};

export default function RowNode({
  id,
  data,
}: NodeProps<RowNodeData>) {
  const columns = data.columns?.count ?? 1;
  const gap = data.columns?.gap ?? 16;
  const rowHeight = typeof data.rowHeight === "number" ? data.rowHeight : undefined;

  const rowRef = useRef<HTMLDivElement | null>(null);
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lastHeightRef = useRef<number>(0);

  const childrenByColumn = Array.from({ length: columns }, (_, colIndex) =>
    (data._allNodes ?? []).filter(
      (n) =>
        (n.data?._rowId === id || n.parentNode === id) &&
        (n.data?.columnIndex ?? n.data?._columnIndex ?? 0) === colIndex
    )
  );

  useLayoutEffect(() => {
    if (!data._registerColumnRect) return;

    requestAnimationFrame(() => {
      Object.entries(columnRefs.current).forEach(([colIndex, el]) => {
        if (!el) return;
        data._registerColumnRect!(id, Number(colIndex), el.getBoundingClientRect());
      });
    });
  }, [columns, gap, id, data._registerColumnRect, data._viewportVersion]);

  useLayoutEffect(() => {
    if (!rowRef.current || !data._onRowMeasure) return;
    const height = rowRef.current.offsetHeight;
    if (height && height !== lastHeightRef.current) {
      lastHeightRef.current = height;
      data._onRowMeasure(id, height);
    }
  });

  return (
    <div
      ref={rowRef}
      style={{
        // Rows are layout-only; prevent them from intercepting node interactions.
        pointerEvents: "none",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 0,
        width: "100%",
        height: rowHeight ?? "auto",
        backgroundColor: data.backgroundColor || "transparent",
        backgroundImage: data.backgroundImage ? `url(${data.backgroundImage})` : "none",
        backgroundSize: data.backgroundSize || "cover",
        backgroundPosition: data.backgroundPosition || "center",
        backgroundRepeat: "no-repeat",
      }}
    >
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
              zIndex: 0,
              pointerEvents: "auto",
              padding: 0,
              backgroundColor: isHovered ? "rgba(59,130,246,0.15)" : "transparent",
              border: isHovered ? "2px dashed rgba(59,130,246,0.8)" : undefined,
              transition: "all 0.2s ease",
            }}
          >
            {!childrenByColumn[colIndex]?.length && (
              <div
                style={{
                  marginTop: 0,
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
