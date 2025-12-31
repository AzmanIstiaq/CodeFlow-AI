import { useCallback } from "react";

export function useSnapToGrid(gridSize: number = 20, enabled: boolean = false) {
  const snapToGrid = useCallback(
    (position: { x: number; y: number }) => {
      if (!enabled) return position;

      return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };
    },
    [gridSize, enabled]
  );

  return { snapToGrid };
}
