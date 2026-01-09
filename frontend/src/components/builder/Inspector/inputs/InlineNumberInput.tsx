/**
 * Inline Number Input
 *
 * Purpose:
 * - Provide a compact numeric input with keyboard step controls.
 *
 * Role in the system:
 * - Used in inspector rows where space is limited.
 *
 * Key responsibilities:
 * - Maintain local string state for partial edits.
 * - Support arrow key increments with shift for larger steps.
 * - Clamp values to optional min/max and normalize on blur.
 *
 * Important constraints and assumptions:
 * - Emits updates only when the value parses to a valid number.
 */

import { useState, useEffect } from "react";

// ================================
// Types
// ================================
interface InlineNumberInputProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Compact numeric input with inline label and unit.
 */
export default function InlineNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  unit = "",
  disabled = false,
}: InlineNumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  // Keep local input in sync with external value updates.
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  // ================================
  // Handlers
  // ================================
  /**
   * Support arrow key increments and blur on Enter.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const increment = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newValue = Number(localValue) + increment;
      const clamped = max !== undefined ? Math.min(newValue, max) : newValue;
      onChange(clamped);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newValue = Number(localValue) - increment;
      const clamped = min !== undefined ? Math.max(newValue, min) : newValue;
      onChange(clamped);
    } else if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  /**
   * Update local state and emit numeric changes when parseable.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Parse and update immediately if valid number.
    const num = parseFloat(newValue);
    if (!isNaN(num)) {
      let clamped = num;
      if (min !== undefined) clamped = Math.max(clamped, min);
      if (max !== undefined) clamped = Math.min(clamped, max);
      onChange(clamped);
    }
  };

  /**
   * Normalize the display value to a clamped number on blur.
   */
  const handleBlur = () => {
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      let clamped = num;
      if (min !== undefined) clamped = Math.max(clamped, min);
      if (max !== undefined) clamped = Math.min(clamped, max);
      setLocalValue(String(clamped));
    } else {
      setLocalValue(String(value));
    }
  };

  return (
    <div className="inline-number-input">
      <label>{label}</label>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
      />
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}
