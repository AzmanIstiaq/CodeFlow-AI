import { useState } from "react";
import type { SectionProps } from "../types";
import { ColorInputRow, SliderInput, NumberInput, Toggle } from "../inputs";

export default function Style({
  selectedNodes,
  updateNode,
  updateNodes,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [perCorner, setPerCorner] = useState(false);
  const isMultiSelect = selectedNodes.length > 1;
  const node = selectedNodes[0];

  if (!node) return null;

  const getValue = (field: string, defaultValue: any = "") => {
    if (isMultiSelect) {
      const values = selectedNodes.map(n => n.data?.[field]);
      const allSame = values.every(v => v === values[0]);
      return allSame ? values[0] || defaultValue : "—";
    }
    return node.data?.[field] || defaultValue;
  };

  const handleChange = (field: string, value: any) => {
    if (isMultiSelect) {
      updateNodes(selectedNodes.map(n => n.id), { [field]: value });
    } else {
      updateNode(node.id, { [field]: value });
    }
  };

  const backgroundColor = getValue("backgroundColor", "#ffffff");
  const borderColor = getValue("borderColor", "#000000");
  const borderWidth = getValue("borderWidth", 0);
  const borderRadius = getValue("borderRadius", 0);
  const opacity = getValue("opacity", 100);

  return (
    <div className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}>
      <div 
        className="inspector-section-title"
        onClick={() => setIsOpen(!isOpen)}
      >
        Style
        <span className="inspector-section-toggle">{isOpen ? "▼" : "▶"}</span>
      </div>
      
      {isOpen && (
        <div className="inspector-section-content">
          <ColorInputRow
            label="Fill"
            value={backgroundColor}
            onChange={(v) => handleChange("backgroundColor", v)}
            disabled={isMultiSelect && backgroundColor === "—"}
          />

          <ColorInputRow
            label="Stroke"
            value={borderColor}
            onChange={(v) => handleChange("borderColor", v)}
            disabled={isMultiSelect && borderColor === "—"}
          />

          <NumberInput
            label="Stroke Width"
            value={typeof borderWidth === "number" ? borderWidth : 0}
            onChange={(v) => handleChange("borderWidth", v)}
            min={0}
            max={20}
            unit="px"
            disabled={isMultiSelect && borderWidth === "—"}
          />

          <div className="inspector-field">
            <div className="inspector-field-header">
              <label>Border Radius</label>
              {!isMultiSelect && (
                <Toggle
                  checked={perCorner}
                  onChange={setPerCorner}
                  label="Per corner"
                />
              )}
            </div>

            {!perCorner ? (
              <NumberInput
                value={typeof borderRadius === "number" ? borderRadius : 0}
                onChange={(v) => handleChange("borderRadius", v)}
                min={0}
                max={100}
                unit="px"
                disabled={isMultiSelect && borderRadius === "—"}
              />
            ) : (
              <div className="inspector-corner-grid">
                <NumberInput
                  label="TL"
                  value={typeof borderRadius === "object" ? borderRadius.topLeft || 0 : borderRadius}
                  onChange={(v) => handleChange("borderRadius", {
                    ...(typeof borderRadius === "object" ? borderRadius : {}),
                    topLeft: v
                  })}
                  min={0}
                  max={100}
                />
                <NumberInput
                  label="TR"
                  value={typeof borderRadius === "object" ? borderRadius.topRight || 0 : borderRadius}
                  onChange={(v) => handleChange("borderRadius", {
                    ...(typeof borderRadius === "object" ? borderRadius : {}),
                    topRight: v
                  })}
                  min={0}
                  max={100}
                />
                <NumberInput
                  label="BL"
                  value={typeof borderRadius === "object" ? borderRadius.bottomLeft || 0 : borderRadius}
                  onChange={(v) => handleChange("borderRadius", {
                    ...(typeof borderRadius === "object" ? borderRadius : {}),
                    bottomLeft: v
                  })}
                  min={0}
                  max={100}
                />
                <NumberInput
                  label="BR"
                  value={typeof borderRadius === "object" ? borderRadius.bottomRight || 0 : borderRadius}
                  onChange={(v) => handleChange("borderRadius", {
                    ...(typeof borderRadius === "object" ? borderRadius : {}),
                    bottomRight: v
                  })}
                  min={0}
                  max={100}
                />
              </div>
            )}
          </div>

          <SliderInput
            label="Opacity"
            value={typeof opacity === "number" ? opacity : 100}
            min={0}
            max={100}
            onChange={(v) => handleChange("opacity", v)}
            unit="%"
            disabled={isMultiSelect && opacity === "—"}
          />
        </div>
      )}
    </div>
  );
}
