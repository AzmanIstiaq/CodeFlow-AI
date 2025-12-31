import { useRef, useLayoutEffect } from "react";

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

  // Register column rects on layout effect
  // Note: frameHeight intentionally excluded from deps to prevent re-registration during drag
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
        const isHovered = hoverState?.sectionId === id && hoverState?.columnIndex === colIndex;
        
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
            padding: "40px 32px",
            backgroundColor: isHovered ? "rgba(59,130,246,0.15)" : "transparent",
            border: isHovered ? "2px dashed rgba(59,130,246,0.8)" : undefined,
            borderRadius: isHovered ? 8 : 0,
            transition: "all 0.2s ease",
          }}
        >
          {!childrenByColumn[colIndex]?.length && (
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
      );
      })}
    </div>
  );
}
