import { useLayoutEffect, useRef } from "react";
import { Handle, Position } from "reactflow";

export default function ColumnsSectionNode({ id, data }: any) {
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const allNodes = data._allNodes ?? [];

  // 🔑 Register column DOM rects for drop detection
  // This effect runs whenever the node moves OR viewport changes
  useLayoutEffect(() => {
    if (!data._registerColumnRect) return;

    const registerRects = () => {
      Object.entries(columnRefs.current).forEach(([colIndex, el]) => {
        if (!el) return;
        data._registerColumnRect(Number(colIndex), el.getBoundingClientRect());
      });
    };

    // Register immediately
    requestAnimationFrame(registerRects);

    // Also set up a MutationObserver to catch position changes
    if (containerRef.current) {
      const observer = new MutationObserver(() => {
        requestAnimationFrame(registerRects);
      });

      observer.observe(containerRef.current, {
        attributes: true,
        attributeFilter: ["style"],
      });

      return () => observer.disconnect();
    }
  }, [
    data.columns,
    data.gap,
    data.padding,
    data._viewportVersion,
    data._nodePosition, // 🔑 Re-register when position changes
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        padding: data.padding,
        background: data.backgroundColor,
        borderRadius: 12,
        minWidth: 300,
      }}
    >
      {data.label && (
        <div
          className="columns-drag-handle"
          style={{ fontWeight: 600, marginBottom: 12, color: "#ffffff" }}
        >
          {data.label}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${data.columns}, 1fr)`,
          gap: data.gap,
        }}
      >
        {Array.from({ length: data.columns }).map((_, colIndex) => {
          // ✅ SINGLE SOURCE OF TRUTH
          const columnChildren = allNodes.filter(
            (n: any) =>
              n.data?._ownedByColumn === id && n.data?._columnIndex === colIndex
          );

          return (
            <div
              key={colIndex}
              id={`column-${id}-${colIndex}`}
              data-column
              data-section-id={id}
              data-col-index={colIndex}
              ref={(el) => {
                columnRefs.current[colIndex] = el;
              }}
              style={{
                minHeight: 120,
                border: "2px dashed #3b82f6",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {columnChildren.length === 0 ? (
                <div
                  style={{
                    color: "#3b82f6",
                    textAlign: "center",
                    fontSize: 12,
                    opacity: 0.8,
                  }}
                >
                  Drop content here
                </div>
              ) : (
                columnChildren.map((node: any) => (
                  <div
                    key={node.id}
                    onClick={() => {
                      // Release node from column when clicked
                      if (data._onRemoveNodeFromColumn) {
                        data._onRemoveNodeFromColumn(node.id);
                      }
                    }}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.08)",
                      fontSize: 12,
                      color: "#ffffff",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(59, 130, 246, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";
                    }}
                    title="Click to drag this node out"
                  >
                    {node.type}: {node.data?.label || node.data?.text}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* React Flow handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
