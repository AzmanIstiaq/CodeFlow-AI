/**
 * Text Section
 *
 * Purpose:
 * - Configure typography settings for text-like nodes.
 *
 * Role in the system:
 * - Provides font and alignment controls in the inspector.
 *
 * Key responsibilities:
 * - Support multi-selection updates with mixed-value handling.
 * - Apply font family, size, weight, line height, spacing, and color.
 * - Gate rendering to text-capable node types.
 *
 * Important constraints and assumptions:
 * - Only text and button nodes expose these properties.
 * - Mixed values are represented with a placeholder indicator.
 */

import { useState } from "react";
import type { SectionProps } from "../types";
import { SelectInput, NumberInput, ColorInputRow } from "../inputs";
import { ChevronDown, ChevronUp } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Typography controls for text and button nodes.
 */
export default function Text({
  selectedNodes,
  updateNode,
  updateNodes,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMultiSelect = selectedNodes.length > 1;
  const node = selectedNodes[0];

  if (!node || (node.type !== "text" && node.type !== "button")) return null;

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
   * Apply a typography update to one or many nodes.
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

  const fontFamily = getValue("fontFamily", "Inter");
  const fontSize = getValue("fontSize", 16);
  const fontWeight = getValue("fontWeight", "400");
  const lineHeight = getValue("lineHeight", 1.5);
  const letterSpacing = getValue("letterSpacing", 0);
  const textAlign = getValue("textAlign", "left");
  const color = getValue("color", "#000000");

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
        Text
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
          <SelectInput
            label="Font Family"
            value={fontFamily}
            options={[
              { value: "Inter", label: "Inter" },
              { value: "Arial", label: "Arial" },
              { value: "Helvetica", label: "Helvetica" },
              { value: "Georgia", label: "Georgia" },
              { value: "Times New Roman", label: "Times New Roman" },
            ]}
            onChange={(v) => handleChange("fontFamily", v)}
            disabled={isMultiSelect && fontFamily === "mixed"}
          />

          <NumberInput
            label="Font Size"
            value={typeof fontSize === "number" ? fontSize : 16}
            onChange={(v) => handleChange("fontSize", v)}
            min={8}
            max={120}
            unit="px"
            disabled={isMultiSelect && fontSize === "mixed"}
          />

          <SelectInput
            label="Font Weight"
            value={String(fontWeight)}
            options={[
              { value: "300", label: "Light" },
              { value: "400", label: "Regular" },
              { value: "500", label: "Medium" },
              { value: "600", label: "Semibold" },
              { value: "700", label: "Bold" },
            ]}
            onChange={(v) => handleChange("fontWeight", v)}
            disabled={isMultiSelect && fontWeight === "mixed"}
          />

          <NumberInput
            label="Line Height"
            value={typeof lineHeight === "number" ? lineHeight : 1.5}
            onChange={(v) => handleChange("lineHeight", v)}
            min={0.5}
            max={3}
            step={0.1}
            disabled={isMultiSelect && lineHeight === "mixed"}
          />

          <NumberInput
            label="Letter Spacing"
            value={typeof letterSpacing === "number" ? letterSpacing : 0}
            onChange={(v) => handleChange("letterSpacing", v)}
            min={-5}
            max={10}
            step={0.1}
            unit="px"
            disabled={isMultiSelect && letterSpacing === "mixed"}
          />

          <SelectInput
            label="Text Align"
            value={textAlign}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
              { value: "justify", label: "Justify" },
            ]}
            onChange={(v) => handleChange("textAlign", v)}
            disabled={isMultiSelect && textAlign === "mixed"}
          />

          <ColorInputRow
            label="Text Color"
            value={color}
            onChange={(v) => handleChange("color", v)}
            disabled={isMultiSelect && color === "mixed"}
          />
        </div>
      )}
    </div>
  );
}
