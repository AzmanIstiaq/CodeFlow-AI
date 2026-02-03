/**
 * Flow Spacing
 *
 * Purpose:
 * - Expose padding, gap, and alignment controls for flow-based layout containers.
 *
 * Role in the system:
 * - Lets designers tune flex-style spacing for sections/rows without touching absolute layouts.
 *
 * Key responsibilities:
 * - Single-value padding (all sides).
 * - Single-value gap between flow children.
 * - Main/cross axis alignment mapped to flexbox props.
 */

import type { SectionProps } from "../types";
import { NumberInput, SelectInput } from "../inputs";
import { DEFAULT_COLUMN_GAP } from "../../../../frontendRules/layout/layoutMetrics";

const MAIN_AXIS_OPTIONS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space Between" },
];

const CROSS_AXIS_OPTIONS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
];

const FLOW_CONTAINER_TYPES = new Set(["row", "column"]);

export default function FlowSpacing({
  selectedNodes,
  updateNode,
  allNodes = [],
}: SectionProps) {
  if (selectedNodes.length !== 1) return null;

  const node = selectedNodes[0];
  const isSupported = FLOW_CONTAINER_TYPES.has(node.type as string);
  const positionMode = node.data?.positionMode ?? (node.type === "column" ? "flow" : "flow");
  
  // Check if this node is owned by a column - if so, we want to edit the column's spacing
  const isColumnOwned = node.data?._ownedByColumn && node.data?._columnIndex !== undefined;
  
  // For column-owned nodes, we need to find the parent container that owns the column
  let targetNode = node;
  if (isColumnOwned) {
    const parentContainer = allNodes.find((n) => n.id === node.data?._ownedByColumn);
    if (parentContainer && FLOW_CONTAINER_TYPES.has(parentContainer.type as string)) {
      targetNode = parentContainer;
    } else {
      return null; // Parent doesn't support flow spacing
    }
  }
  
  // If the selected node is a column, it should be its own targetNode
  if (node.type === "column") {
    targetNode = node;
  }

  if (!isSupported || positionMode !== "flow") return null;

  const padding =
    typeof targetNode.data?.padding === "number" ? targetNode.data.padding : 0;
  const gap =
    typeof targetNode.data?.columns?.gap === "number"
      ? targetNode.data.columns.gap
      : typeof targetNode.data?.gap === "number"
        ? targetNode.data.gap
        : DEFAULT_COLUMN_GAP;
  const justifyContent = targetNode.data?.justifyContent ?? "flex-start";
  const alignItems = targetNode.data?.alignItems ?? "flex-start";

  const handlePaddingChange = (value: number) => {
    const next = Math.max(0, Math.round(value));
    updateNode(targetNode.id, { padding: next });
  };

  const handleGapChange = (value: number) => {
    const next = Math.max(0, Math.round(value));
    
    if (node.type === "column") {
      updateNode(node.id, { gap: next });
    } else {
      const nextColumns = targetNode.data?.columns
        ? { ...targetNode.data.columns, gap: next }
        : undefined;

      updateNode(targetNode.id, {
        gap: next,
        ...(nextColumns ? { columns: nextColumns } : {}),
      });
    }
  };

  const handleMainAlignChange = (value: string) => {
    updateNode(targetNode.id, { justifyContent: value });
  };

  const handleCrossAlignChange = (value: string) => {
    updateNode(targetNode.id, { alignItems: value });
  };

  return (
    <div className="inspector-section inspector-section-open">
      <div className="inspector-section-title">
        {node.type === "column" 
          ? "Column Flow Spacing" 
          : isColumnOwned 
            ? `Column ${node.data?._columnIndex + 1} Flow Spacing` 
            : "Flow Spacing"
        }
      </div>
      <div className="inspector-section-content">
        <NumberInput
          label="Padding"
          value={padding}
          min={0}
          onChange={handlePaddingChange}
          unit="px"
        />

        <NumberInput
          label="Gap"
          value={gap}
          min={0}
          onChange={handleGapChange}
          unit="px"
        />

        <SelectInput
          label="Main Axis"
          value={justifyContent}
          options={MAIN_AXIS_OPTIONS}
          onChange={handleMainAlignChange}
        />

        <SelectInput
          label="Cross Axis"
          value={alignItems}
          options={CROSS_AXIS_OPTIONS}
          onChange={handleCrossAlignChange}
        />

        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          {node.type === "column"
            ? "Controls spacing for this column. The column itself decides its padding, gap, and alignment."
            : isColumnOwned 
              ? `Controls spacing for Column ${node.data?._columnIndex + 1} within its parent container. Values map to flex properties.`
              : "Applies only when this container uses flow layout; values map directly to flex padding/gap/justify-content/align-items."
          }
        </div>
      </div>
    </div>
  );
}
