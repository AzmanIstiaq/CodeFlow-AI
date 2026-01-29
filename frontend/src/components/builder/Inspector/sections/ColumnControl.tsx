/**
 * Column Control
 *
 * Purpose:
 * - Adjust column count for section, header, and footer layout containers.
 *
 * Role in the system:
 * - Lets designers change drop-zone grids for pinned bars and frames.
 *
 * Key responsibilities:
 * - Clamp column count per container type.
 * - Keep existing gap value.
 * - Re-home children when columns are reduced so content never disappears.
 */

import { useState } from "react";
import type { SectionProps } from "../types";
import { ChevronDown, ChevronUp } from "lucide-react";
import ColumnButtons from "./ColumnButtons";
import {
  isColumnControlSupported,
  getColumnOptions,
  getColumnCount as getPolicyColumnCount,
  getColumnGap,
  getOwnedColumnChildren,
  normalizeChildrenMap,
  buildOverflowUpdates,
} from "../../../../frontendRules/inspector/inspectorPolicy";

export default function ColumnControl({
  selectedNodes,
  updateNode,
  allNodes = [],
}: SectionProps) {
  const columnOptions = getColumnOptions();
  const MAX_COLUMNS = Math.max(...columnOptions);
  const [isOpen, setIsOpen] = useState(true);
  const node = selectedNodes[0];

  if (
    !node ||
    selectedNodes.length !== 1 ||
    !isColumnControlSupported(node.type as string)
  ) {
    return null;
  }

  const hasRows =
    node.type === "section" &&
    allNodes?.some((n) => n.type === "row" && n.parentNode === node.id);
  if (hasRows) {
    // When rows exist, section-level columns are unused; avoid a redundant control.
    return null;
  }

  const columnCount = getPolicyColumnCount(node);
  const columnGap = getColumnGap(node);
  const ownedChildren = getOwnedColumnChildren(node.id, allNodes);

  const updateColumns = (count: number) => {
    const nextCount = Math.max(1, Math.min(MAX_COLUMNS, Math.round(count)));
    const overflowUpdates = buildOverflowUpdates(ownedChildren, nextCount);
    overflowUpdates.forEach(({ id, updates }) => updateNode(id, updates));
    const childrenMap = normalizeChildrenMap(ownedChildren, nextCount);

    updateNode(node.id, {
      columns: {
        count: nextCount,
        gap: columnGap,
      },
      ...(childrenMap ? { children: childrenMap } : {}),
    });
  };

  // Layout differences:
  // - Bars (header/footer): accordion UI with toggle.
  // - Section: simple always-open block (matches original frame control styling).
  if (node.type === "header" || node.type === "footer") {
    return (
      <div
        className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}
      >
        <div
          className="inspector-section-title"
          onClick={() => setIsOpen(!isOpen)}
        >
          Columns
          <span className="inspector-section-toggle">
            {isOpen ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </span>
        </div>

        {isOpen && (
          <div className="inspector-section-content">
            <ColumnButtons
              value={columnCount}
              onChange={(count) => updateColumns(count)}
              options={columnOptions}
            />
          </div>
        )}
      </div>
    );
  }

  // Section UI: keep original minimal design (always open, no accordion chrome).
  return (
    <div className="inspector-section inspector-section-open">
      <div className="inspector-section-content">
        <ColumnButtons
          value={columnCount}
          onChange={(count) => updateColumns(count)}
          options={columnOptions}
          label="Frame Columns"
        />
      </div>
    </div>
  );
}
