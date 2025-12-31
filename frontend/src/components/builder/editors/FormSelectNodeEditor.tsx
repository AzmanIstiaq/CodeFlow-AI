import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function FormSelectNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="form-select-content" 
        title="Select Settings" 
        icon="📋"
        isCollapsed={collapsedSections["form-select-content"]}
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
            placeholder="Select an option..."
          />
        </div>

        <div className="panel-field">
          <label>Options (comma separated)</label>
          <input
            className="input-field"
            type="text"
            value={(localData.options || []).join(", ")}
            onChange={(e) => handleChange("options", e.target.value.split(",").map((s: string) => s.trim()))}
            placeholder="Option 1, Option 2, Option 3"
          />
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
        id="form-select-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["form-select-style"]}
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

        <div className="panel-field">
          <label>Label Color</label>
          <input
            type="color"
            value={localData.labelColor || "#374151"}
            onChange={(e) => handleChange("labelColor", e.target.value)}
            style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
