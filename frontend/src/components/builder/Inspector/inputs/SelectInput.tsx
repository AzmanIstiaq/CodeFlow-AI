/**
 * Select Input
 *
 * Purpose:
 * - Provide a labeled select dropdown for discrete values.
 *
 * Role in the system:
 * - Used for typography and enum-based inspector controls.
 *
 * Key responsibilities:
 * - Render options and emit selection changes.
 */

// ================================
// Types
// ================================
interface SelectInputProps {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Labeled select dropdown.
 */
export default function SelectInput({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SelectInputProps) {
  return (
    <div className="select-input">
      {label && <label>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
