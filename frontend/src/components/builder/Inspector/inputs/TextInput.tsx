/**
 * Text Input
 *
 * Purpose:
 * - Provide a labeled text input for inspector fields.
 *
 * Role in the system:
 * - Used for editing freeform text properties.
 *
 * Key responsibilities:
 * - Forward value changes to the parent handler.
 */

// ================================
// Types
// ================================
interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Simple text input with optional label.
 */
export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: TextInputProps) {
  return (
    <div className="text-input">
      {label && <label>{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
