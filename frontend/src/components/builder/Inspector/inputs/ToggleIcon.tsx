/**
 * Toggle Icon
 *
 * Purpose:
 * - Render a compact toggle button with an icon glyph.
 *
 * Role in the system:
 * - Used for boolean inspector controls like visibility and lock.
 *
 * Key responsibilities:
 * - Reflect active state via className.
 * - Forward click events and tooltip text.
 */

import type { ReactNode } from "react";

// ================================
// Types
// ================================
interface ToggleIconProps {
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Icon-only toggle button.
 */
export default function ToggleIcon({
  icon,
  active,
  onClick,
  tooltip,
  disabled = false,
}: ToggleIconProps) {
  return (
    <button
      className={`toggle-icon ${active ? "active" : ""}`}
      onClick={onClick}
      title={tooltip}
      disabled={disabled}
      type="button"
    >
      <span className="toggle-icon-render" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
