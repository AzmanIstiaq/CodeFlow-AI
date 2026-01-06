import type { InspectorProps } from "./types";
import SelectionHeader from "./SelectionHeader";
import { LayoutPosition, RowControl, Style, Text, Effects, Advanced } from "./sections";
import "./inspector.css";

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
