/**
 * Color Input Row
 *
 * Purpose:
 * - Wrap a color input with a label for inspector layout.
 *
 * Role in the system:
 * - Standardizes labeled color inputs across sections.
 *
 * Key responsibilities:
 * - Pass value and change handlers through to ColorInput.
 */

import ColorInput from "./ColorInput";

// ================================
// Types
// ================================
interface ColorInputRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Labeled color control for inspector forms.
 */
export default function ColorInputRow({
  label,
  value,
  onChange,
  disabled = false,
}: ColorInputRowProps) {
  return (
    <div className="inspector-row">
      <label>{label}</label>
      <ColorInput value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}
