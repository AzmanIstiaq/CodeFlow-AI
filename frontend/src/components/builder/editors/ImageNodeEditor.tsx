import CollapsibleSection from "../CollapsibleSection";
import type { NodeEditorProps } from "./types";

export default function ImageNodeEditor({ localData, handleChange, collapsedSections, toggleSection }: NodeEditorProps) {
  return (
    <>
      <CollapsibleSection 
        id="image-content" 
        title="Content" 
        icon="🖼️"
        isCollapsed={collapsedSections["image-content"]}
        onToggle={toggleSection}
      >
        <div className="panel-field">
          <label>Image URL</label>
          <input
            className="input-field"
            type="text"
            value={localData.src || ""}
            onChange={(e) => handleChange("src", e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="panel-field">
          <label>Alt Text</label>
          <input
            className="input-field"
            type="text"
            value={localData.alt || ""}
            onChange={(e) => handleChange("alt", e.target.value)}
            placeholder="Image description"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="image-sizing" 
        title="Sizing" 
        icon="📐"
        isCollapsed={collapsedSections["image-sizing"]}
        onToggle={toggleSection}
      >
        <div className="panel-field-row">
          <div className="panel-field-inline">
            <label>Width</label>
            <input
              className="number-field-compact"
              type="number"
              min="50"
              max="1200"
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
              max="800"
              value={localData.height || 200}
              onChange={(e) => handleChange("height", parseInt(e.target.value))}
              style={{ width: 70 }}
            />
          </div>
        </div>

        <div className="panel-field">
          <label>Object Fit</label>
          <select
            className="input-field"
            value={localData.objectFit || "cover"}
            onChange={(e) => handleChange("objectFit", e.target.value)}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
            <option value="none">None</option>
          </select>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="image-style" 
        title="Styling" 
        icon="🎨"
        isCollapsed={collapsedSections["image-style"]}
        onToggle={toggleSection}
      >
        <div className="panel-field-row">
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
