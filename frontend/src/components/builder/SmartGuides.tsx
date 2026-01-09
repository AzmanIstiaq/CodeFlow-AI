/**
 * Smart Guides Overlay
 *
 * Purpose:
 * - Render alignment and spacing guides over the canvas during drag operations.
 *
 * Role in the system:
 * - Provides visual feedback for snapping and spacing relationships.
 *
 * Key responsibilities:
 * - Convert flow coordinates into screen space based on the viewport.
 * - Clip guide rendering to frame bounds for visual containment.
 * - Display distance labels for spacing guides when provided.
 *
 * Important constraints and assumptions:
 * - Guides are optional and the component renders nothing if none are active.
 * - Frame bounds are expected, but viewport bounds are used as a fallback.
 */

// ================================
// Types
// ================================
interface GuideLine {
  position: number;
  type: "vertical" | "horizontal";
  snapTarget?: "left" | "right" | "center" | "top" | "bottom";
  distance?: number;
  spacing?: boolean;
}

interface SmartGuidesProps {
  guides: {
    vertical: GuideLine[];
    horizontal: GuideLine[];
    frameBounds?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    };
  };
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// ================================
// Component
// ================================
/**
 * SVG overlay for alignment, spacing, and measurement guides.
 */
export default function SmartGuides({ guides, viewport }: SmartGuidesProps) {
  if (!guides.vertical.length && !guides.horizontal.length) return null;
  if (!guides.frameBounds) {
    // If no frame bounds, use viewport bounds as a fallback.
    const viewportBounds = {
      left: -viewport.x / viewport.zoom,
      top: -viewport.y / viewport.zoom,
      right: (-viewport.x + window.innerWidth) / viewport.zoom,
      bottom: (-viewport.y + window.innerHeight) / viewport.zoom,
    };
    guides.frameBounds = viewportBounds;
  }

  const frameBounds = guides.frameBounds;

  // ================================
  // Coordinate Conversion
  // ================================
  // The conversion formula: screen = (flow * zoom) + viewport offset.
  const getScreenCoords = (flowX: number, flowY: number) => {
    return {
      x: flowX * viewport.zoom + viewport.x,
      y: flowY * viewport.zoom + viewport.y,
    };
  };

  const topLeft = getScreenCoords(frameBounds.left, frameBounds.top);
  const bottomRight = getScreenCoords(frameBounds.right, frameBounds.bottom);

  const clipWidth = bottomRight.x - topLeft.x;
  const clipHeight = bottomRight.y - topLeft.y;

  // ================================
  // Formatting
  // ================================
  /**
   * Round distances for a compact on-canvas label.
   */
  const formatDistance = (distance: number) => {
    return `${Math.round(distance)}px`;
  };

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
        overflow: "visible",
      }}
    >
      <defs>
        <clipPath id="frame-clip">
          <rect
            x={topLeft.x}
            y={topLeft.y}
            width={clipWidth}
            height={clipHeight}
          />
        </clipPath>
        {/* Arrow marker for spacing guides */}
        <marker
          id="spacing-arrow-start"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00FF00" />
        </marker>
        <marker
          id="spacing-arrow-end"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 10 0 L 0 5 L 10 10 z" fill="#00FF00" />
        </marker>
      </defs>

      <g clipPath="url(#frame-clip)">
        {/* Vertical guides */}
        {guides.vertical.map((guide, i) => {
          // Convert flow position to screen coordinates for accurate overlay.
          const screenPos = getScreenCoords(guide.position, 0);
          const screenX = screenPos.x;
          const isSpacing = guide.spacing;
          // Color coding: pink for center, yellow for edge, green for spacing.
          const isCenterAlign = guide.snapTarget === "center";
          const strokeColor = isSpacing
            ? "#00FF00"
            : isCenterAlign
            ? "#FF00FF"
            : "#FFFF00";
          const strokeWidth = isSpacing ? 2 : 1.5;

          return (
            <g key={`v-${i}`}>
              <line
                x1={screenX}
                y1={topLeft.y}
                x2={screenX}
                y2={bottomRight.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isSpacing ? "8,4" : "5,5"}
                markerStart={
                  isSpacing ? "url(#spacing-arrow-start)" : undefined
                }
                markerEnd={isSpacing ? "url(#spacing-arrow-end)" : undefined}
              />
              {/* Distance label */}
              {guide.distance !== undefined && (
                <g>
                  <rect
                    x={screenX + 8}
                    y={topLeft.y + 8}
                    width={40}
                    height={18}
                    fill="rgba(0, 0, 0, 0.8)"
                    rx={4}
                  />
                  <text
                    x={screenX + 28}
                    y={topLeft.y + 20}
                    fill="#FFFFFF"
                    fontSize="11"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {formatDistance(guide.distance)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Horizontal guides */}
        {guides.horizontal.map((guide, i) => {
          // Convert flow position to screen coordinates for accurate overlay.
          const screenPos = getScreenCoords(0, guide.position);
          const screenY = screenPos.y;
          const isSpacing = guide.spacing;
          // Color coding: pink for center, yellow for edge, green for spacing.
          const isCenterAlign = guide.snapTarget === "center";
          const strokeColor = isSpacing
            ? "#00FF00"
            : isCenterAlign
            ? "#FF00FF"
            : "#FFFF00";
          const strokeWidth = isSpacing ? 2 : 1.5;

          return (
            <g key={`h-${i}`}>
              <line
                x1={topLeft.x}
                y1={screenY}
                x2={bottomRight.x}
                y2={screenY}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isSpacing ? "8,4" : "5,5"}
                markerStart={
                  isSpacing ? "url(#spacing-arrow-start)" : undefined
                }
                markerEnd={isSpacing ? "url(#spacing-arrow-end)" : undefined}
              />
              {/* Distance label */}
              {guide.distance !== undefined && (
                <g>
                  <rect
                    x={topLeft.x + 8}
                    y={screenY - 9}
                    width={40}
                    height={18}
                    fill="rgba(0, 0, 0, 0.8)"
                    rx={4}
                  />
                  <text
                    x={topLeft.x + 28}
                    y={screenY + 2}
                    fill="#FFFFFF"
                    fontSize="11"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {formatDistance(guide.distance)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
