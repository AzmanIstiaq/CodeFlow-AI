/**
 * Toggle
 *
 * Purpose:
 * - Provide a labeled boolean switch control.
 *
 * Role in the system:
 * - Used in inspector sections for enabling/disabling features.
 *
 * Key responsibilities:
 * - Mirror checked state and emit changes via onChange.
 */

// ================================
// Types
// ================================
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Checkbox-based toggle with optional label.
 */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleProps) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="toggle-slider"></span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}
