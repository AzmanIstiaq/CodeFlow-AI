import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function FormRadioNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="form-radio-content" 
        title="Radio Settings" 
        icon="🔘"
        isCollapsed={collapsedSections["form-radio-content"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Label</label>
          <input
            className="input-field"
            type="text"
            value={localData.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Group label"
          />
        </div>

        <div className="panel-field">
          <label>Group Name</label>
          <input
            className="input-field"
            type="text"
            value={localData.groupName || ""}
            onChange={(e) => handleChange("groupName", e.target.value)}
            placeholder="radio-group"
          />
          <small>Unique identifier for this radio group</small>
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
          <label>Layout</label>
          <select
            className="input-field"
            value={localData.layout || "vertical"}
            onChange={(e) => handleChange("layout", e.target.value)}
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
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
        id="form-radio-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["form-radio-style"]}
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
            <label>Radio Size</label>
            <input
              className="number-field-compact"
              type="number"
              min="12"
              max="32"
              value={localData.radioSize || 18}
              onChange={(e) => handleChange("radioSize", parseInt(e.target.value))}
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
            <label>Radio Color</label>
            <input
              type="color"
              value={localData.radioColor || "#3b82f6"}
              onChange={(e) => handleChange("radioColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
