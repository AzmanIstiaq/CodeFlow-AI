import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function ShapeNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="shape-properties" 
        title="Properties" 
        icon="⬜"
        isCollapsed={collapsedSections["shape-properties"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Shape Type</label>
          <select
            className="input-field"
            value={localData.shapeType || "rectangle"}
            onChange={(e) => handleChange("shapeType", e.target.value)}
          >
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>

        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Width</label>
            <input
              className="number-field-compact"
              type="number"
              min="20"
              max="500"
              value={localData.width || 100}
              onChange={(e) => handleChange("width", parseInt(e.target.value))}
              style={{ width: 70 }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Height</label>
            <input
              className="number-field-compact"
              type="number"
              min="20"
              max="500"
              value={localData.height || 100}
              onChange={(e) => handleChange("height", parseInt(e.target.value))}
              style={{ width: 70 }}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="shape-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["shape-style"]}
        onToggle={toggleSection}
      >
        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Fill Color</label>
            <input
              type="color"
              value={localData.backgroundColor || "#3b82f6"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Radius</label>
            <input
              className="number-field-compact"
              type="number"
              min="0"
              max="100"
              value={localData.borderRadius || 0}
              onChange={(e) => handleChange("borderRadius", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Opacity</label>
            <input
              className="number-field-compact"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={localData.opacity ?? 1}
              onChange={(e) => handleChange("opacity", parseFloat(e.target.value))}
              style={{ width: 60 }}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
