/**
 * Color Input
 *
 * Purpose:
 * - Provide a combined color picker and hex input field.
 *
 * Role in the system:
 * - Used across inspector sections to edit color properties.
 *
 * Key responsibilities:
 * - Maintain a local hex value while editing.
 * - Validate hex input on blur and commit only valid values.
 *
 * Important constraints and assumptions:
 * - Only 6-digit hex colors are accepted for manual input.
 * - Local value mirrors the external value unless user input is invalid.
 */

import { useState, useEffect } from "react";

// ================================
// Types
// ================================
interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Color picker with a synchronized hex text field.
 */
export default function ColorInput({
  value,
  onChange,
  label,
  disabled = false,
}: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Keep local input in sync with external value updates.
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // ================================
  // Handlers
  // ================================
  /**
   * Validate and commit the hex value when the input loses focus.
   */
  const handleBlur = () => {
    if (/^#[0-9A-F]{6}$/i.test(localValue)) {
      onChange(localValue);
    } else {
      setLocalValue(value);
    }
  };

  return (
    <div className="color-input">
      {label && <label>{label}</label>}
      <div className="color-input-row">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="color-swatch"
        />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
          onBlur={handleBlur}
          disabled={disabled}
          className="color-hex"
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  );
}
