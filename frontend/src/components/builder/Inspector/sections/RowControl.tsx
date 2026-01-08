import type { SectionProps } from "../types";
import { NumberInput } from "../inputs";

export default function RowControl({
  selectedNodes,
  updateNode,
  updateNodes,
  allNodes,
}: SectionProps) {
  if (selectedNodes.length !== 1) return null;

  const node = selectedNodes[0];

  if (node.type !== "section") return null;

  const pageWidth = node.data?.pageWidth ?? 1280;
  const rows =
    allNodes?.filter((n) => n.type === "row" && n.parentNode === node.id) ?? [];
  const orderedRows = [...rows].sort(
    (a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0)
  );

  const handleAddRow = () => {
    const rowId = `row-${Date.now()}`;
    const columnGap = node.data?.gap ?? 24;
    const pageHeight = node.data?.pageHeight ?? 800;

    updateNodes([], {
      __addNode: {
        id: rowId,
        type: "row",
        parentNode: node.id,
        position: { x: 0, y: 0 },
        data: {
          columns: {
            count: 3,
            gap: columnGap,
          },
          rowHeight: rows.length === 0 ? pageHeight : 240,
          order: rows.length,
        },
      },
    });
  };

  return (
    <div className="inspector-section inspector-section-open">
      <div className="inspector-section-title">Frame</div>
      <div className="inspector-section-content">
        <div className="inspector-field">
          <label>Page Width</label>
          <div className="inspector-readonly">{pageWidth}px</div>
        </div>

        <button className="inspector-button" onClick={handleAddRow}>
          Add Row
        </button>

        {orderedRows.length > 0 && (
          <div className="inspector-field">
            <label>Rows</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {orderedRows.map((row: any, index: number) => {
                const rowColumns = row.data?.columns?.count ?? 1;
                const rowGap = row.data?.columns?.gap ?? 24;
                const rowHeight = row.data?.rowHeight ?? 240;
                return (
                  <div key={row.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Row {index + 1}
                    </div>
                    <NumberInput
                      label="Row Height"
                      value={rowHeight}
                      min={40}
                      max={2000}
                      unit="px"
                      onChange={(value) =>
                        updateNode(row.id, {
                          rowHeight: value,
                        })
                      }
                    />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[1, 2, 3, 4, 6].map((count) => (
                        <button
                          key={count}
                          className="inspector-button"
                          onClick={() =>
                            updateNode(row.id, {
                              columns: {
                                count,
                                gap: rowGap,
                              },
                            })
                          }
                          style={{
                            flex: "1 1 40px",
                            background: rowColumns === count ? "#eff6ff" : "#ffffff",
                            borderColor: rowColumns === count ? "#3b82f6" : "#e5e7eb",
                            color: rowColumns === count ? "#3b82f6" : "#374151",
                          }}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
