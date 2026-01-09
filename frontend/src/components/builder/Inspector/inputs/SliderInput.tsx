/**
 * Slider Input
 *
 * Purpose:
 * - Provide a labeled range slider with optional value display.
 *
 * Role in the system:
 * - Used for numeric inspector controls like opacity.
 *
 * Key responsibilities:
 * - Clamp user input via min/max/step configuration.
 * - Emit numeric changes to the parent handler.
 */

// ================================
// Types
// ================================
interface SliderInputProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  unit?: string;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Range slider with a value readout.
 */
export default function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  showValue = true,
  unit = "",
  disabled = false,
}: SliderInputProps) {
  return (
    <div className="slider-input">
      {label && <label>{label}</label>}
      <div className="slider-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
        />
        {showValue && (
          <span className="slider-value">
            {value}
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
