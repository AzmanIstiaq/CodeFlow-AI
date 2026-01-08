import { useState, useRef, useEffect } from "react";

interface RadiusHandleProps {
  borderRadius: number | { topLeft?: number; topRight?: number; bottomLeft?: number; bottomRight?: number };
  onRadiusChange: (radius: number, corner?: string) => void;
  isVisible: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function RadiusHandle({
  borderRadius,
  onRadiusChange,
  isVisible,
  position = "top-left",
  onDragStart,
  onDragEnd,
}: RadiusHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const startRadiusRef = useRef(0);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Get the radius value for this specific corner
  const getCornerRadius = () => {
    if (typeof borderRadius === "number") {
      return borderRadius;
    }
    const cornerMap = {
      "top-left": borderRadius.topLeft || 0,
      "top-right": borderRadius.topRight || 0,
      "bottom-left": borderRadius.bottomLeft || 0,
      "bottom-right": borderRadius.bottomRight || 0,
    };
    return cornerMap[position];
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      
      // Calculate radius change based on diagonal movement
      const delta = (deltaX + deltaY) / 2;
      const newRadius = Math.max(0, Math.min(100, startRadiusRef.current + delta));
      
      // Pass corner info if Ctrl is pressed
      if (isCtrlPressed) {
        const cornerMap = {
          "top-left": "topLeft",
          "top-right": "topRight",
          "bottom-left": "bottomLeft",
          "bottom-right": "bottomRight",
        };
        onRadiusChange(Math.round(newRadius), cornerMap[position]);
      } else {
        onRadiusChange(Math.round(newRadius));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onDragEnd) {
        onDragEnd();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onRadiusChange, position, isCtrlPressed, onDragEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('RadiusHandle mousedown', position, getCornerRadius());
    setIsDragging(true);
    setIsCtrlPressed(e.ctrlKey || e.metaKey);
    startRadiusRef.current = getCornerRadius();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    if (onDragStart) {
      onDragStart();
    }
  };

  if (!isVisible) return null;

  const positions = {
    "top-left": { top: 2, left: 2 },
    "top-right": { top: 2, right: 2 },
    "bottom-left": { bottom: 2, left: 2 },
    "bottom-right": { bottom: 2, right: 2 },
  };

  const cursorStyles = {
    "top-left": "nwse-resize",
    "top-right": "nesw-resize",
    "bottom-left": "nesw-resize",
    "bottom-right": "nwse-resize",
  };

  const currentRadius = getCornerRadius();

  return (
    <div
      className="nodrag"
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        ...positions[position],
        width: 8,
        height: 8,
        backgroundColor: isDragging ? "#3b82f6" : "#10b981",
        border: "2px solid white",
        borderRadius: "50%",
        cursor: cursorStyles[position],
        zIndex: 10000,
        boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
        transition: isDragging ? "none" : "background-color 0.15s",
        pointerEvents: "auto",
      }}
      title={`${isCtrlPressed ? "Individual " : ""}Border Radius: ${currentRadius}px${isCtrlPressed ? " (Ctrl)" : ""}`}
    />
  );
}
