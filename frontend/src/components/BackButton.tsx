/**
 * Back Button
 *
 * Purpose:
 * - Provide a consistent navigation control to return to a previous page.
 *
 * Role in the system:
 * - Used across pages to reduce navigation boilerplate and maintain UX consistency.
 *
 * Key responsibilities:
 * - Render a button that navigates to a provided route.
 * - Derive a helpful title for accessibility and hover guidance.
 *
 * Important constraints and assumptions:
 * - Navigation is handled by react-router's history stack.
 */

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// ================================
// Types
// ================================
interface BackButtonProps {
  to?: string;
  label?: string;
}

// ================================
// Component
// ================================
/**
 * Navigate to a target route when clicked.
 */
export default function BackButton({
  to = "/",
  label = "Back",
}: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="back-button"
      // Title adapts to the target to clarify navigation intent.
      title={`Back to ${to === "/" ? "Home" : "previous page"}`}
    >
      <ArrowLeft size={16} aria-hidden="true" /> {label}
    </button>
  );
}
