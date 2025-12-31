interface SmartGuidesProps {
  guides: {
    vertical: number[];
    horizontal: number[];
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

export default function SmartGuides({ guides, viewport }: SmartGuidesProps) {
  if (!guides.vertical.length && !guides.horizontal.length) return null;
  if (!guides.frameBounds) return null; // Only show guides when inside a frame

  const frameBounds = guides.frameBounds;
  
  // Calculate frame bounds in screen coordinates
  const getScreenCoords = (flowX: number, flowY: number) => ({
    x: (flowX - viewport.x) * viewport.zoom,
    y: (flowY - viewport.y) * viewport.zoom,
  });

  const topLeft = getScreenCoords(frameBounds.left, frameBounds.top);
  const bottomRight = getScreenCoords(frameBounds.right, frameBounds.bottom);
  
  const clipWidth = bottomRight.x - topLeft.x;
  const clipHeight = bottomRight.y - topLeft.y;

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
      </defs>
      
      <g clipPath="url(#frame-clip)">
        {/* Vertical guides - clipped to frame bounds */}
        {guides.vertical.map((x, i) => {
          const screenX = (x - viewport.x) * viewport.zoom;
          return (
            <line
              key={`v-${i}`}
              x1={screenX}
              y1={topLeft.y}
              x2={screenX}
              y2={bottomRight.y}
              stroke="#FF00FF"
              strokeWidth={1.5}
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Horizontal guides - clipped to frame bounds */}
        {guides.horizontal.map((y, i) => {
          const screenY = (y - viewport.y) * viewport.zoom;
          return (
            <line
              key={`h-${i}`}
              x1={topLeft.x}
              y1={screenY}
              x2={bottomRight.x}
              y2={screenY}
              stroke="#FF00FF"
              strokeWidth={1.5}
              strokeDasharray="5,5"
            />
          );
        })}
      </g>
    </svg>
  );
}
