import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function FormTextareaNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="form-textarea-content" 
        title="Textarea Settings" 
        icon="📝"
        isCollapsed={collapsedSections["form-textarea-content"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Label</label>
          <input
            className="input-field"
            type="text"
            value={localData.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Field label"
          />
        </div>

        <div className="panel-field">
          <label>Placeholder</label>
          <input
            className="input-field"
            type="text"
            value={localData.placeholder || ""}
            onChange={(e) => handleChange("placeholder", e.target.value)}
            placeholder="Enter your message..."
          />
        </div>

        <div className="panel-field">
          <label>Rows</label>
          <input
            className="number-field-compact"
            type="number"
            min="2"
            max="20"
            value={localData.rows || 4}
            onChange={(e) => handleChange("rows", parseInt(e.target.value))}
            style={{ width: 70 }}
          />
          <small>Number of visible text lines</small>
        </div>

        <div className="panel-field">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={localData.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              style={{ width: "auto", margin: 0 }}
            />
            Required Field
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="form-textarea-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["form-textarea-style"]}
        onToggle={toggleSection}
      >
        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Width</label>
            <input
              className="number-field-compact"
              type="number"
              min="100"
              max="800"
              value={localData.width || 300}
              onChange={(e) => handleChange("width", parseInt(e.target.value))}
              style={{ width: 70 }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Height</label>
            <input
              className="number-field-compact"
              type="number"
              min="50"
              max="500"
              value={localData.height || 100}
              onChange={(e) => handleChange("height", parseInt(e.target.value))}
              style={{ width: 70 }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Font Size</label>
            <input
              className="number-field-compact"
              type="number"
              min="10"
              max="24"
              value={localData.fontSize || 14}
              onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>
        </div>

        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Background</label>
            <input
              type="color"
              value={localData.backgroundColor || "#ffffff"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Border</label>
            <input
              type="color"
              value={localData.borderColor || "#d1d5db"}
              onChange={(e) => handleChange("borderColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Radius</label>
            <input
              className="number-field-compact"
              type="number"
              min="0"
              max="20"
              value={localData.borderRadius || 6}
              onChange={(e) => handleChange("borderRadius", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
