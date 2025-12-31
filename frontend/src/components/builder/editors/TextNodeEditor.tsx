import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function TextNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="text-content" 
        title="Content" 
        icon="📝"
        isCollapsed={collapsedSections["text-content"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Text Content</label>
          <textarea
            className="textarea-field"
            value={localData.text || ""}
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="Enter text content"
            rows={6}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="text-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["text-style"]}
        onToggle={toggleSection}
      >
        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Color</label>
            <input
              type="color"
              value={localData.color || "#000000"}
              onChange={(e) => handleChange("color", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>

          <div className="panel-field-inline">
            <label>Size</label>
            <input
              className="number-field-compact"
              type="number"
              min="8"
              max="48"
              value={localData.fontSize || 14}
              onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
              style={{ width: 60 }}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
