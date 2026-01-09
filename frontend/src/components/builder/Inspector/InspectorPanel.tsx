/**
 * Inspector Panel
 *
 * Purpose:
 * - Provide a consolidated sidebar for editing selected node properties.
 *
 * Role in the system:
 * - Central entry point for all inspector sections and controls.
 *
 * Key responsibilities:
 * - Render section components for layout, style, text, effects, and advanced actions.
 * - Forward selection data and update handlers to child sections.
 *
 * Important constraints and assumptions:
 * - Renders nothing when there is no selection to avoid empty UI panels.
 */

import type { InspectorProps } from "./types";
import SelectionHeader from "./SelectionHeader";
import {
  LayoutPosition,
  RowControl,
  Style,
  Text,
  Effects,
  Advanced,
} from "./sections";
import "./inspector.css";

// ================================
// Component
// ================================
/**
 * Inspector sidebar for the current selection.
 */
export default function InspectorPanel({
  selectedNodes,
  updateNode,
  updateNodes,
  deleteNode,
  deleteNodes,
  allNodes,
  onClose,
}: InspectorProps) {
  if (selectedNodes.length === 0) return null;

  return (
    <div className="inspector-panel">
      <SelectionHeader
        selectedNodes={selectedNodes}
        updateNode={updateNode}
        updateNodes={updateNodes}
        onClose={onClose}
        allNodes={allNodes}
      />

      <div className="inspector-content">
        <LayoutPosition
          selectedNodes={selectedNodes}
          updateNode={updateNode}
          updateNodes={updateNodes}
          allNodes={allNodes}
        />

        <RowControl
          selectedNodes={selectedNodes}
          updateNode={updateNode}
          updateNodes={updateNodes}
          allNodes={allNodes}
        />

        <Style
          selectedNodes={selectedNodes}
          updateNode={updateNode}
          updateNodes={updateNodes}
          allNodes={allNodes}
        />

        <Text
          selectedNodes={selectedNodes}
          updateNode={updateNode}
          updateNodes={updateNodes}
          allNodes={allNodes}
        />

        <Effects
          selectedNodes={selectedNodes}
          updateNode={updateNode}
          updateNodes={updateNodes}
          allNodes={allNodes}
        />

        <Advanced
          selectedNodes={selectedNodes}
          updateNode={updateNode}
          updateNodes={updateNodes}
          deleteNode={deleteNode}
          deleteNodes={deleteNodes}
          allNodes={allNodes}
        />
      </div>
    </div>
  );
}
