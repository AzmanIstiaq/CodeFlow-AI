import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function ButtonNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="button-content" 
        title="Content" 
        icon="🔘"
        isCollapsed={collapsedSections["button-content"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Button Text</label>
          <input
            className="input-field"
            type="text"
            value={localData.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Enter button text"
          />
        </div>

        <div className="panel-field">
          <label>Link URL (href)</label>
          <input
            className="input-field"
            type="text"
            value={localData.href || ""}
            onChange={(e) => handleChange("href", e.target.value)}
            placeholder="https://example.com"
          />
          <small>Leave empty for no link</small>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="button-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["button-style"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Variant</label>
          <select
            className="input-field"
            value={localData.variant || "primary"}
            onChange={(e) => handleChange("variant", e.target.value)}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>

        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Background</label>
            <input
              type="color"
              value={localData.backgroundColor || "#3b82f6"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Text</label>
            <input
              type="color"
              value={localData.textColor || "#ffffff"}
              onChange={(e) => handleChange("textColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>
        </div>

        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Size</label>
            <input
              className="number-field-compact"
              type="number"
              min="10"
              max="32"
              value={localData.fontSize || 16}
              onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
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
              value={localData.borderRadius ?? 8}
              onChange={(e) => handleChange("borderRadius", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Width</label>
            <input
              className="number-field-compact"
              type="number"
              min="80"
              max="400"
              value={localData.width || 120}
              onChange={(e) => handleChange("width", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
