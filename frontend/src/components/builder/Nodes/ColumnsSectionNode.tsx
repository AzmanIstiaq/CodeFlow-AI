import { useLayoutEffect, useRef } from "react";
import { Handle, Position } from "reactflow";

export default function ColumnsSectionNode({ id, data }: any) {
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const allNodes = data._allNodes ?? [];

  // 🔑 Register column DOM rects for drop detection
  useLayoutEffect(() => {
    if (!data._registerColumnRect) return;

    requestAnimationFrame(() => {
      Object.entries(columnRefs.current).forEach(([colIndex, el]) => {
        if (!el) return;
        data._registerColumnRect(Number(colIndex), el.getBoundingClientRect());
      });
    });
  }, [
    data.columns,
    data.gap,
    data.padding,
    data._viewportVersion,
    data._nodePosition,
    data._registerColumnRect,
  ]);

  return (
    <div
      style={{
        padding: data.padding,
        background: data.backgroundColor,
        borderRadius: 12,
        minWidth: 300,
      }}
    >
      {data.label && (
        <div style={{ fontWeight: 600, marginBottom: 12 }}>{data.label}</div>
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
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.08)",
                      fontSize: 12,
                    }}
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
