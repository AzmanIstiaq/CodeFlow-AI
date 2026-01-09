/**
 * Node Toolbar
 *
 * Purpose:
 * - Provide quick actions to add nodes to the canvas based on editor mode.
 *
 * Role in the system:
 * - Acts as the primary node creation surface for both workflow and builder modes.
 *
 * Key responsibilities:
 * - Gate available node types based on current mode and frame presence.
 * - Delegate node creation to the parent via the addNode callback.
 * - Provide inline hover styling for icon buttons.
 *
 * Important constraints and assumptions:
 * - Builder controls are shown only when a frame exists on the canvas.
 * - All button actions are side-effectful through addNode; no local state is used.
 */

import { Bot, Play, Terminal } from "lucide-react";

// ================================
// Types
// ================================
interface ToolbarProps {
  addNode: (type: string, label: string) => void;
  mode: "workflow" | "builder";
  hasFrame?: boolean;
}

// ================================
// Component
// ================================
/**
 * Render mode-specific node creation controls.
 */
export default function NodeToolbar({
  addNode,
  mode,
  hasFrame = false,
}: ToolbarProps) {
  return (
    <div className="node-toolbar">
      {mode === "workflow" && (
        <>
          <button
            className="toolbar-button toolbar-btn-start"
            onClick={() => addNode("input", "Start Node")}
          >
            <Play size={16} aria-hidden="true" /> Add Start Node
          </button>
          <button
            className="toolbar-button toolbar-btn-ai"
            onClick={() => addNode("ai", "AI Node")}
          >
            <Bot size={16} aria-hidden="true" /> Add AI Node
          </button>
          <button
            className="toolbar-button toolbar-btn-output"
            onClick={() => addNode("output", "Output Node")}
          >
            <Terminal size={16} aria-hidden="true" /> Add Output Node
          </button>
        </>
      )}

      {mode === "builder" && hasFrame && (
        <>
          <button
            className="toolbar-button"
            onClick={() => addNode("text", "Text Node")}
            title="Text (T)"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("button", "Button")}
            title="Button (B)"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="8" width="18" height="8" rx="4" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("image", "Image")}
            title="Image (I)"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("container", "Container")}
            title="Container (C)"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("shape", "Shape")}
            title="Shape (S)"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("formInput", "Input Field")}
            title="Input Field"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="8" width="18" height="8" rx="2" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("formTextarea", "Text Area")}
            title="Text Area"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="7" y1="16" x2="13" y2="16" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("formCheckbox", "Checkbox")}
            title="Checkbox"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <polyline points="9 11 12 14 16 10" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("formRadio", "Radio Buttons")}
            title="Radio Buttons"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </button>
          <button
            className="toolbar-button"
            onClick={() => addNode("formSelect", "Select Dropdown")}
            title="Select Dropdown"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              // Hover styles are applied inline to keep this component self-contained.
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <polyline points="15 10 18 13 15 16" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
