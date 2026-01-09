/**
 * Effects Section
 *
 * Purpose:
 * - Configure visual effects such as drop shadows.
 *
 * Role in the system:
 * - Provides optional styling enhancements for nodes.
 *
 * Key responsibilities:
 * - Enable or disable shadow effects.
 * - Control shadow offsets, blur, spread, and color.
 * - Apply updates across single or multi-selection.
 *
 * Important constraints and assumptions:
 * - Shadow controls are hidden unless the effect is enabled.
 * - Mixed values are represented with a placeholder indicator.
 */

import { useState } from "react";
import type { SectionProps } from "../types";
import { Toggle, NumberInput, ColorInput } from "../inputs";
import { ChevronDown, ChevronUp } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Visual effects controls for the current selection.
 */
export default function Effects({
  selectedNodes,
  updateNode,
  updateNodes,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMultiSelect = selectedNodes.length > 1;
  const node = selectedNodes[0];

  if (!node) return null;

  // ================================
  // Value Resolution
  // ================================
  /**
   * Resolve values across selection, returning a mixed indicator when needed.
   */
  const getValue = (field: string, defaultValue: any = "") => {
    if (isMultiSelect) {
      const values = selectedNodes.map((n) => n.data?.[field]);
      const allSame = values.every((v) => v === values[0]);
      return allSame ? values[0] || defaultValue : "mixed";
    }
    return node.data?.[field] || defaultValue;
  };

  // ================================
  // Handlers
  // ================================
  /**
   * Apply an effects update to one or many nodes.
   */
  const handleChange = (field: string, value: any) => {
    if (isMultiSelect) {
      updateNodes(
        selectedNodes.map((n) => n.id),
        { [field]: value }
      );
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

  // ================================
  // Render
  // ================================
  return (
    <div
      className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}
    >
      <div
        className="inspector-section-title"
        onClick={() => setIsOpen(!isOpen)}
      >
        Effects
        <span className="inspector-section-toggle">
          {isOpen ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
        </span>
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
                  disabled={isMultiSelect && shadowX === "mixed"}
                />
                <NumberInput
                  label="Y"
                  value={typeof shadowY === "number" ? shadowY : 4}
                  onChange={(v) => handleChange("shadowY", v)}
                  min={-50}
                  max={50}
                  disabled={isMultiSelect && shadowY === "mixed"}
                />
              </div>

              <div className="inspector-inline-row">
                <NumberInput
                  label="Blur"
                  value={typeof shadowBlur === "number" ? shadowBlur : 8}
                  onChange={(v) => handleChange("shadowBlur", v)}
                  min={0}
                  max={100}
                  disabled={isMultiSelect && shadowBlur === "mixed"}
                />
                <NumberInput
                  label="Spread"
                  value={typeof shadowSpread === "number" ? shadowSpread : 0}
                  onChange={(v) => handleChange("shadowSpread", v)}
                  min={-50}
                  max={50}
                  disabled={isMultiSelect && shadowSpread === "mixed"}
                />
              </div>

              <ColorInput
                label="Shadow Color"
                value={shadowColor}
                onChange={(v) => handleChange("shadowColor", v)}
                disabled={isMultiSelect && shadowColor === "mixed"}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
