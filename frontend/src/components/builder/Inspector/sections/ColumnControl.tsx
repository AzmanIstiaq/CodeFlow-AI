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

const SUPPORTED_TYPES = new Set(["header", "footer", "section"]);
const COLUMN_OPTIONS = [1, 2, 3, 4, 6];
const MAX_COLUMNS = Math.max(...COLUMN_OPTIONS);

export default function ColumnControl({
  selectedNodes,
  updateNode,
  allNodes = [],
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const node = selectedNodes[0];

  if (
    !node ||
    selectedNodes.length !== 1 ||
    !SUPPORTED_TYPES.has(node.type as string)
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

  const columnCount =
    typeof node.data?.columns?.count === "number" ? node.data.columns.count : 1;
  const columnGap =
    node.type === "header" || node.type === "footer"
      ? 0
      : typeof node.data?.columns?.gap === "number"
        ? node.data.columns.gap
        : 24;

  const ownedChildren =
    allNodes?.filter((n) => n.data?._ownedByColumn === node.id) ?? [];

  const getChildColumn = (child: any) => {
    const idx =
      typeof child.data?._columnIndex === "number"
        ? child.data._columnIndex
        : typeof child.data?.columnIndex === "number"
          ? child.data.columnIndex
          : 0;
    return idx;
  };

  const normalizeChildren = (nextCount: number) => {
    if (!ownedChildren.length) return null;
    const lastIdx = Math.max(0, nextCount - 1);
    const map: Record<number, string[]> = {};

    ownedChildren.forEach((child) => {
      const clamped = Math.min(Math.max(getChildColumn(child), 0), lastIdx);
      if (!map[clamped]) map[clamped] = [];
      if (!map[clamped].includes(child.id)) {
        map[clamped].push(child.id);
      }
    });

    return map;
  };

  /**
   * When columns shrink, move overflowed children into the last column
   * and append their order so they stay visible.
   */
  const clampChildren = (nextCount: number) => {
    if (!ownedChildren.length) return;
    const lastIdx = Math.max(0, nextCount - 1);

    const overflow = ownedChildren.filter(
      (child) => getChildColumn(child) >= nextCount
    );

    if (!overflow.length) return;

    const targetSiblings = ownedChildren.filter(
      (child) => getChildColumn(child) === lastIdx
    );

    let orderCursor =
      Math.max(
        -1,
        ...targetSiblings.map((n) =>
          typeof n.data?.order === "number" ? n.data.order : -1
        )
      ) + 1;

    overflow.forEach((child) => {
      const updates: any = {
        _columnIndex: lastIdx,
        columnIndex: lastIdx,
      };

      if (child.data?.positionMode === "flow") {
        updates.order = orderCursor++;
      }

      updateNode(child.id, updates);
    });
  };

  const updateColumns = (count: number) => {
    const nextCount = Math.max(1, Math.min(MAX_COLUMNS, Math.round(count)));
    clampChildren(nextCount);
    const childrenMap = normalizeChildren(nextCount);

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
              options={COLUMN_OPTIONS}
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
          options={COLUMN_OPTIONS}
          label="Frame Columns"
        />
      </div>
    </div>
  );
}
