import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function FormCheckboxNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="form-checkbox-content" 
        title="Checkbox Settings" 
        icon="☑️"
        isCollapsed={collapsedSections["form-checkbox-content"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Label</label>
          <input
            className="input-field"
            type="text"
            value={localData.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Checkbox label"
          />
        </div>

        <div className="panel-field">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={localData.checked || false}
              onChange={(e) => handleChange("checked", e.target.checked)}
              style={{ width: "auto", margin: 0 }}
            />
            Default Checked
          </label>
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
        id="form-checkbox-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["form-checkbox-style"]}
        onToggle={toggleSection}
      >
        <div className="panel-field-row">
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

          <div className="panel-field-inline">
            <label>Box Size</label>
            <input
              className="number-field-compact"
              type="number"
              min="12"
              max="32"
              value={localData.checkboxSize || 18}
              onChange={(e) => handleChange("checkboxSize", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>
        </div>

        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Label Color</label>
            <input
              type="color"
              value={localData.labelColor || "#374151"}
              onChange={(e) => handleChange("labelColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Box Color</label>
            <input
              type="color"
              value={localData.checkboxColor || "#3b82f6"}
              onChange={(e) => handleChange("checkboxColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
