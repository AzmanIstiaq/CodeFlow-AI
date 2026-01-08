import { useState } from "react";
import type { SectionProps } from "../types";
import { NumberInput } from "../inputs";

export default function FrameColumnControl({ selectedNodes, updateNode }: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const node = selectedNodes[0];
  const maxColumns = 4;

  if (!node || selectedNodes.length !== 1 || node.type !== "section") return null;

  const columnCount =
    typeof node.data?.columns?.count === "number" ? node.data.columns.count : 1;
  const columnGap =
    typeof node.data?.columns?.gap === "number" ? node.data.columns.gap : 24;

  const updateColumns = (count: number) => {
    const nextCount = Math.max(1, Math.min(maxColumns, Math.round(count)));
    updateNode(node.id, {
      columns: {
        count: nextCount,
        gap: columnGap,
      },
    });
  };

  return (
    <div className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}>
      {/* <div
        className="inspector-section-title"
        onClick={() => setIsOpen(!isOpen)}
      >
        Frame
        <span className="inspector-section-toggle">{isOpen ? "v" : ">"}</span>
      </div> */}

      {isOpen && (
        <div className="inspector-section-content">
          <NumberInput
            label="Columns"
            value={columnCount}
            min={1}
            max={maxColumns}
            onChange={(value) => updateColumns(value)}
          />
        </div>
      )}
    </div>
  );
}
