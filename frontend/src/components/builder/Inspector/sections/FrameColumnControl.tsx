/**
 * Frame Column Control
 *
 * Purpose:
 * - Configure the column count for a selected frame/section.
 *
 * Role in the system:
 * - Provides layout control for section column structures.
 *
 * Key responsibilities:
 * - Clamp column count to a supported range.
 * - Persist column changes via updateNode.
 *
 * Important constraints and assumptions:
 * - Only applies to a single selected section node.
 * - Column gap is preserved when updating count.
 */

import { useState } from "react";
import type { SectionProps } from "../types";
import { NumberInput } from "../inputs";

// ================================
// Component
// ================================
/**
 * Control for section column count.
 */
export default function FrameColumnControl({
  selectedNodes,
  updateNode,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const node = selectedNodes[0];
  const maxColumns = 4;

  if (!node || selectedNodes.length !== 1 || node.type !== "section") return null;

  const columnCount =
    typeof node.data?.columns?.count === "number" ? node.data.columns.count : 1;
  const columnGap =
    typeof node.data?.columns?.gap === "number" ? node.data.columns.gap : 24;

  // ================================
  // Handlers
  // ================================
  /**
   * Clamp column count and persist updates on the section node.
   */
  const updateColumns = (count: number) => {
    const nextCount = Math.max(1, Math.min(maxColumns, Math.round(count)));
    updateNode(node.id, {
      columns: {
        count: nextCount,
        gap: columnGap,
      },
    });
  };

  // ================================
  // Render
  // ================================
  return (
    <div
      className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}
    >
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
