/**
 * Icon Button
 *
 * Purpose:
 * - Render a compact icon-only button for actions.
 *
 * Role in the system:
 * - Used in inspector sections for action buttons like delete.
 *
 * Key responsibilities:
 * - Apply a variant class for styling.
 * - Forward click events and tooltip text.
 */

import type { ReactNode } from "react";

// ================================
// Types
// ================================
interface IconButtonProps {
  icon: ReactNode;
  onClick: () => void;
  tooltip?: string;
  variant?: "default" | "danger";
  disabled?: boolean;
}

// ================================
// Component
// ================================
/**
 * Icon-only action button with variant styling.
 */
export default function IconButton({
  icon,
  onClick,
  tooltip,
  variant = "default",
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      className={`icon-button icon-button-${variant}`}
      onClick={onClick}
      title={tooltip}
      disabled={disabled}
      type="button"
    >
      {icon}
    </button>
  );
}
