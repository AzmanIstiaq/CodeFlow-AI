import { useState } from "react";
import type { SectionProps } from "../types";
import { InlineNumberInput, ToggleIcon } from "../inputs";

export default function LayoutPosition({
  selectedNodes,
  updateNode,
  updateNodes,
}: SectionProps) {
  const [aspectLocked, setAspectLocked] = useState(false);
  const isMultiSelect = selectedNodes.length > 1;
  const node = selectedNodes[0];

  if (!node) return null;

  const getValue = (field: "x" | "y" | "width" | "height") => {
    if (isMultiSelect) {
      const values = selectedNodes.map(n => {
        if (field === "x") return n.position.x;
        if (field === "y") return n.position.y;
        if (field === "width") return n.style?.width || n.data?.width || 0;
        if (field === "height") return n.style?.height || n.data?.height || 0;
        return 0;
      });
      const allSame = values.every(v => v === values[0]);
      return allSame ? values[0] : "—";
    }

    if (field === "x") return node.position.x;
    if (field === "y") return node.position.y;
    if (field === "width") return node.style?.width || node.data?.width || 0;
    if (field === "height") return node.style?.height || node.data?.height || 0;
    return 0;
  };

  const handleChange = (field: "x" | "y" | "width" | "height", value: number) => {
    if (isMultiSelect) {
      const updates: any = {};
      
      if (field === "x" || field === "y") {
        updates.position = selectedNodes[0].position;
        updates.position[field] = value;
      } else {
        updates[field] = value;
      }
      
      updateNodes(selectedNodes.map(n => n.id), updates);
    } else {
      if (field === "x" || field === "y") {
        updateNode(node.id, {
          position: { ...node.position, [field]: value }
        });
      } else {
        const updates: any = { [field]: value };
        
        if (aspectLocked && field === "width") {
          const currentWidth = node.style?.width || node.data?.width || 100;
          const currentHeight = node.style?.height || node.data?.height || 100;
          const ratio = currentHeight / currentWidth;
          updates.height = Math.round(value * ratio);
        } else if (aspectLocked && field === "height") {
          const currentWidth = node.style?.width || node.data?.width || 100;
          const currentHeight = node.style?.height || node.data?.height || 100;
          const ratio = currentWidth / currentHeight;
          updates.width = Math.round(value * ratio);
        }
        
        updateNode(node.id, updates);
      }
    }
  };

  const x = getValue("x");
  const y = getValue("y");
  const w = getValue("width");
  const h = getValue("height");

  return (
    <div className="inspector-section inspector-section-open">
      <div className="inspector-section-title">Layout & Position</div>
      <div className="inspector-section-content">
        <div className="inspector-inline-row">
          <InlineNumberInput
            label="X"
            value={x}
            onChange={(v) => handleChange("x", v)}
            disabled={isMultiSelect && x === "—"}
          />
          <InlineNumberInput
            label="Y"
            value={y}
            onChange={(v) => handleChange("y", v)}
            disabled={isMultiSelect && y === "—"}
          />
        </div>
        
        <div className="inspector-inline-row">
          <InlineNumberInput
            label="W"
            value={w}
            onChange={(v) => handleChange("width", v)}
            min={1}
            disabled={isMultiSelect && w === "—"}
          />
          <InlineNumberInput
            label="H"
            value={h}
            onChange={(v) => handleChange("height", v)}
            min={1}
            disabled={isMultiSelect && h === "—"}
          />
          {!isMultiSelect && (
            <ToggleIcon
              icon="🔒"
              active={aspectLocked}
              onClick={() => setAspectLocked(!aspectLocked)}
              tooltip="Lock aspect ratio"
            />
          )}
        </div>
      </div>
    </div>
  );
}
