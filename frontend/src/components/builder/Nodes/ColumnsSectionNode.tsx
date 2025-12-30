import { useRef, useLayoutEffect } from "react";

type ColumnsSectionNodeProps = {
  id: string;
  columns: number;
  gap: number;
  childrenByColumn: any[][];
  registerColumnRect: (
    sectionId: string,
    columnIndex: number,
    rect: DOMRect
  ) => void;
  viewportVersion?: number;
};

export default function ColumnsSectionNode({
  id,
  columns,
  gap,
  childrenByColumn,
  registerColumnRect,
  viewportVersion,
}: ColumnsSectionNodeProps) {
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Register column rects on layout effect
  useLayoutEffect(() => {
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
        gap,
        width: "100%",
        minHeight: "60vh",
        borderTop: "1.5px solid rgba(59,130,246,0.6)",
        borderBottom: "1.5px solid rgba(59,130,246,0.6)",
      }}
    >
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div
          key={colIndex}
          ref={(el) => {
            columnRefs.current[colIndex] = el;
          }}
          data-column-index={colIndex}
          style={{
            position: "relative",
            zIndex: 10,
            pointerEvents: "auto",
            minHeight: "100%",
            padding: 24,
            borderLeft:
              colIndex === 0 ? "none" : "1.5px dotted rgba(59,130,246,0.6)",
          }}
        >
          {childrenByColumn[colIndex]?.length ? (
            childrenByColumn[colIndex].map((node) => (
              <div
                key={node.id}
                style={{
                  padding: 12,
                  borderRadius: 6,
                  background: "rgba(59,130,246,0.08)",
                  fontSize: 12,
                }}
              >
                <strong>{node.type}</strong>
                {node.data?.label && ` — ${node.data.label}`}
                {node.data?.text && ` — ${node.data.text}`}
              </div>
            ))
          ) : (
            <div
              style={{
                marginTop: 40,
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
      ))}
    </div>
  );
}
