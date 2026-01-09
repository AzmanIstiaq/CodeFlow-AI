/**
 * Number Input
 *
 * Purpose:
 * - Provide a labeled numeric input with optional unit display.
 *
 * Role in the system:
 * - Used for inspector fields that require numeric values.
 *
 * Key responsibilities:
 * - Enforce numeric input with min/max/step configuration.
 * - Emit parsed numeric values to the parent handler.
 */

// ================================
// Types
// ================================
interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Numeric input with optional unit suffix.
 */
export default function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
}: NumberInputProps) {
  return (
    <div className="number-input">
      {label && <label>{label}</label>}
      <div className="number-input-row">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
    </div>
  );
}
