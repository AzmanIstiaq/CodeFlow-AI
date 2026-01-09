/**
 * Style Section
 *
 * Purpose:
 * - Edit visual styling properties for selected nodes.
 *
 * Role in the system:
 * - Central place for fill, stroke, border radius, and opacity controls.
 *
 * Key responsibilities:
 * - Support multi-selection updates with mixed-value handling.
 * - Toggle between uniform and per-corner border radius controls.
 * - Propagate style changes through parent update handlers.
 *
 * Important constraints and assumptions:
 * - Mixed values are represented with a placeholder indicator.
 * - Per-corner editing is disabled for multi-selection to avoid ambiguity.
 */

import { useState } from "react";
import type { SectionProps } from "../types";
import { ColorInputRow, SliderInput, NumberInput, Toggle } from "../inputs";
import { ChevronDown, ChevronUp } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Style controls for fill, stroke, border radius, and opacity.
 */
export default function Style({
  selectedNodes,
  updateNode,
  updateNodes,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);
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
      return allSame
        ? values[0] !== undefined
          ? values[0]
          : defaultValue
        : "mixed";
    }
    return node.data?.[field] !== undefined ? node.data[field] : defaultValue;
  };

  // ================================
  // Handlers
  // ================================
  /**
   * Apply a style update to one or many nodes.
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

  const backgroundColor = getValue("backgroundColor", "#ffffff");
  const borderColor = getValue("borderColor", "#000000");
  const borderWidth = getValue("borderWidth", 0);
  const borderRadius = getValue("borderRadius", 0);
  const opacity = getValue("opacity", 100);

  // Determine if we're in per-corner mode based on current value.
  const perCorner = typeof borderRadius === "object" && borderRadius !== null;

  // ================================
  // Border Radius Helpers
  // ================================
  /**
   * Normalize the border radius into either a number or per-corner object.
   */
  const getBorderRadiusValue = () => {
    if (typeof borderRadius === "object" && borderRadius !== null) {
      return {
        topLeft: borderRadius.topLeft ?? 0,
        topRight: borderRadius.topRight ?? 0,
        bottomLeft: borderRadius.bottomLeft ?? 0,
        bottomRight: borderRadius.bottomRight ?? 0,
      };
    }
    return typeof borderRadius === "number" ? borderRadius : 0;
  };

  /**
   * Switch between uniform and per-corner radius modes.
   */
  const togglePerCorner = () => {
    if (perCorner) {
      // Switching from per-corner to uniform.
      const corners = getBorderRadiusValue() as any;
      const allEqual =
        corners.topLeft === corners.topRight &&
        corners.topRight === corners.bottomLeft &&
        corners.bottomLeft === corners.bottomRight;
      const uniformValue = allEqual ? corners.topLeft : corners.topLeft;
      handleChange("borderRadius", uniformValue);
    } else {
      // Switching from uniform to per-corner.
      const currentValue = typeof borderRadius === "number" ? borderRadius : 0;
      handleChange("borderRadius", {
        topLeft: currentValue,
        topRight: currentValue,
        bottomLeft: currentValue,
        bottomRight: currentValue,
      });
    }
  };

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
        Style
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
          <ColorInputRow
            label="Fill"
            value={backgroundColor}
            onChange={(v) => handleChange("backgroundColor", v)}
            disabled={isMultiSelect && backgroundColor === "mixed"}
          />

          <ColorInputRow
            label="Stroke"
            value={borderColor}
            onChange={(v) => handleChange("borderColor", v)}
            disabled={isMultiSelect && borderColor === "mixed"}
          />

          <NumberInput
            label="Stroke Width"
            value={typeof borderWidth === "number" ? borderWidth : 0}
            onChange={(v) => handleChange("borderWidth", v)}
            min={0}
            max={20}
            unit="px"
            disabled={isMultiSelect && borderWidth === "mixed"}
          />

          <div className="inspector-field">
            <div className="inspector-field-header">
              <label>Border Radius</label>
              {!isMultiSelect && (
                <Toggle
                  checked={perCorner}
                  onChange={togglePerCorner}
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
                disabled={isMultiSelect && borderRadius === "mixed"}
              />
            ) : (
              <div className="inspector-corner-grid">
                <NumberInput
                  label="TL"
                  value={(getBorderRadiusValue() as any).topLeft}
                  onChange={(v) => {
                    const current = getBorderRadiusValue() as any;
                    handleChange("borderRadius", {
                      topLeft: v,
                      topRight: current.topRight,
                      bottomLeft: current.bottomLeft,
                      bottomRight: current.bottomRight,
                    });
                  }}
                  min={0}
                  max={100}
                />
                <NumberInput
                  label="TR"
                  value={(getBorderRadiusValue() as any).topRight}
                  onChange={(v) => {
                    const current = getBorderRadiusValue() as any;
                    handleChange("borderRadius", {
                      topLeft: current.topLeft,
                      topRight: v,
                      bottomLeft: current.bottomLeft,
                      bottomRight: current.bottomRight,
                    });
                  }}
                  min={0}
                  max={100}
                />
                <NumberInput
                  label="BL"
                  value={(getBorderRadiusValue() as any).bottomLeft}
                  onChange={(v) => {
                    const current = getBorderRadiusValue() as any;
                    handleChange("borderRadius", {
                      topLeft: current.topLeft,
                      topRight: current.topRight,
                      bottomLeft: v,
                      bottomRight: current.bottomRight,
                    });
                  }}
                  min={0}
                  max={100}
                />
                <NumberInput
                  label="BR"
                  value={(getBorderRadiusValue() as any).bottomRight}
                  onChange={(v) => {
                    const current = getBorderRadiusValue() as any;
                    handleChange("borderRadius", {
                      topLeft: current.topLeft,
                      topRight: current.topRight,
                      bottomLeft: current.bottomLeft,
                      bottomRight: v,
                    });
                  }}
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
            disabled={isMultiSelect && opacity === "mixed"}
          />
        </div>
      )}
    </div>
  );
}
