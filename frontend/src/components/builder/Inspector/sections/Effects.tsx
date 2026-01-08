import { useState } from "react";
import type { SectionProps } from "../types";
import { Toggle, NumberInput, ColorInput } from "../inputs";

export default function Effects({
  selectedNodes,
  updateNode,
  updateNodes,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const shadowEnabled = getValue("shadowEnabled", false);
  const shadowX = getValue("shadowX", 0);
  const shadowY = getValue("shadowY", 4);
  const shadowBlur = getValue("shadowBlur", 8);
  const shadowSpread = getValue("shadowSpread", 0);
  const shadowColor = getValue("shadowColor", "#00000040");

  return (
    <div className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}>
      <div 
        className="inspector-section-title"
        onClick={() => setIsOpen(!isOpen)}
      >
        Effects
        <span className="inspector-section-toggle">{isOpen ? "▼" : "▶"}</span>
      </div>
      
      {isOpen && (
        <div className="inspector-section-content">
          <Toggle
            checked={shadowEnabled}
            onChange={(v) => handleChange("shadowEnabled", v)}
            label="Drop Shadow"
          />

          {shadowEnabled && (
            <>
              <div className="inspector-inline-row">
                <NumberInput
                  label="X"
                  value={typeof shadowX === "number" ? shadowX : 0}
                  onChange={(v) => handleChange("shadowX", v)}
                  min={-50}
                  max={50}
                  disabled={isMultiSelect && shadowX === "—"}
                />
                <NumberInput
                  label="Y"
                  value={typeof shadowY === "number" ? shadowY : 4}
                  onChange={(v) => handleChange("shadowY", v)}
                  min={-50}
                  max={50}
                  disabled={isMultiSelect && shadowY === "—"}
                />
              </div>

              <div className="inspector-inline-row">
                <NumberInput
                  label="Blur"
                  value={typeof shadowBlur === "number" ? shadowBlur : 8}
                  onChange={(v) => handleChange("shadowBlur", v)}
                  min={0}
                  max={100}
                  disabled={isMultiSelect && shadowBlur === "—"}
                />
                <NumberInput
                  label="Spread"
                  value={typeof shadowSpread === "number" ? shadowSpread : 0}
                  onChange={(v) => handleChange("shadowSpread", v)}
                  min={-50}
                  max={50}
                  disabled={isMultiSelect && shadowSpread === "—"}
                />
              </div>

              <ColorInput
                label="Shadow Color"
                value={shadowColor}
                onChange={(v) => handleChange("shadowColor", v)}
                disabled={isMultiSelect && shadowColor === "—"}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
