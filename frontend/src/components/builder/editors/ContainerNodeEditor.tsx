import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function ContainerNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="container-sizing" 
        title="Sizing" 
        icon="📦"
        isCollapsed={collapsedSections["container-sizing"]}
        onToggle={toggleSection}
      >
        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Width</label>
            <input
              className="number-field-compact"
              type="number"
              min="100"
              max="1200"
              value={localData.width || 400}
              onChange={(e) => handleChange("width", parseInt(e.target.value))}
              style={{ width: 70 }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Height</label>
            <input
              className="number-field-compact"
              type="number"
              min="100"
              max="800"
              value={localData.height || 300}
              onChange={(e) => handleChange("height", parseInt(e.target.value))}
              style={{ width: 70 }}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="container-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["container-style"]}
        onToggle={toggleSection}
      >
        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Background</label>
            <input
              type="color"
              value={localData.backgroundColor || "#f3f4f6"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Padding</label>
            <input
              className="number-field-compact"
              type="number"
              min="0"
              max="100"
              value={localData.padding || 20}
              onChange={(e) => handleChange("padding", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Radius</label>
            <input
              className="number-field-compact"
              type="number"
              min="0"
              max="50"
              value={localData.borderRadius || 8}
              onChange={(e) => handleChange("borderRadius", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="container-layout" 
        title="Layout" 
        icon="📐"
        isCollapsed={collapsedSections["container-layout"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Flex Direction</label>
          <select
            className="input-field"
            value={localData.flexDirection || "column"}
            onChange={(e) => handleChange("flexDirection", e.target.value)}
          >
            <option value="row">Row</option>
            <option value="column">Column</option>
          </select>
        </div>

        <div className="panel-field">
          <label>Justify Content</label>
          <select
            className="input-field"
            value={localData.justifyContent || "flex-start"}
            onChange={(e) => handleChange("justifyContent", e.target.value)}
          >
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
            <option value="space-between">Space Between</option>
            <option value="space-around">Space Around</option>
          </select>
        </div>

        <div className="panel-field">
          <label>Align Items</label>
          <select
            className="input-field"
            value={localData.alignItems || "flex-start"}
            onChange={(e) => handleChange("alignItems", e.target.value)}
          >
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>

        <div className="panel-field">
          <label>Gap</label>
          <input
            className="number-field-compact"
            type="number"
            min="0"
            max="100"
            value={localData.gap || 12}
            onChange={(e) => handleChange("gap", parseInt(e.target.value))}
            style={{ width: 70 }}
          />
          <small>px - Space between children</small>
        </div>
      </CollapsibleSection>
    </>
  );
}
