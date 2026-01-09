/**
 * Zoom Controls
 *
 * Purpose:
 * - Provide viewport zoom, fit, and grid toggle controls on the canvas.
 *
 * Role in the system:
 * - Offers quick navigation and view adjustments for the builder canvas.
 *
 * Key responsibilities:
 * - Call React Flow zoom and fitView APIs.
 * - Display current zoom percentage from the viewport state.
 * - Toggle grid overlay when supported by parent.
 *
 * Important constraints and assumptions:
 * - Uses inline hover styles to avoid external CSS dependencies.
 * - Grid toggle is optional and only rendered when a handler is provided.
 */

import { useReactFlow, useViewport } from "reactflow";

// ================================
// Types
// ================================
interface ZoomControlsProps {
  showGrid?: boolean;
  onToggleGrid?: () => void;
}

// ================================
// Component
// ================================
/**
 * Floating control panel for canvas zoom and viewport actions.
 */
export default function ZoomControls({
  showGrid = false,
  onToggleGrid,
}: ZoomControlsProps = {}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const viewport = useViewport();
  const currentZoom = Math.round(viewport.zoom * 100);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => zoomIn()}
        title="Zoom In (+)"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          color: "#374151",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          // Apply hover styling without triggering a re-render.
          e.currentTarget.style.background = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          textAlign: "center",
          padding: "4px 0",
          fontWeight: 500,
        }}
      >
        {currentZoom}%
      </div>

      <button
        onClick={() => zoomOut()}
        title="Zoom Out (-)"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          color: "#374151",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          // Apply hover styling without triggering a re-render.
          e.currentTarget.style.background = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />

      <button
        onClick={() => fitView({ padding: 0.2, duration: 200 })}
        title="Fit to Screen (Shift+1)"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          color: "#374151",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          // Apply hover styling without triggering a re-render.
          e.currentTarget.style.background = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
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
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>

      {onToggleGrid && (
        <>
          <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />
          <button
            onClick={onToggleGrid}
            title="Toggle Grid (Ctrl+')"
            style={{
              background: showGrid ? "#eff6ff" : "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: showGrid ? "#3b82f6" : "#374151",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (!showGrid) e.currentTarget.style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showGrid ? "#eff6ff" : "none";
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
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
