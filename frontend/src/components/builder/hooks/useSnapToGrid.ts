/**
 * useSnapToGrid Hook
 *
 * Provides position snapping to a configurable grid.
 * Optional feature - only snaps when enabled.
 *
 * How it works:
 * - Takes a position {x, y}
 * - Rounds each coordinate to nearest grid multiple
 * - Returns snapped position
 *
 * Common use cases:
 * - Align nodes to grid during drag (optional editor feature)
 * - Improve visual consistency and layout
 *
 * Formula: snapped = round(position / gridSize) * gridSize
 * Example with gridSize=20:
 *   position.x = 37 → round(37/20)*20 = round(1.85)*20 = 2*20 = 40
 *   position.x = 35 → round(35/20)*20 = round(1.75)*20 = 2*20 = 40
 */

import { useCallback } from "react";

export function useSnapToGrid(gridSize: number = 20, enabled: boolean = false) {
  /**
   * Snap position to grid
   *
   * @param position - Current position {x, y}
   * @returns Snapped position if enabled, otherwise original position
   *
   * Disabled when:
   * - enabled = false (feature turned off)
   * - User holding modifier key (overriding snap)
   */
  const snapToGrid = useCallback(
    (position: { x: number; y: number }) => {
      // Don't snap if feature is disabled
      if (!enabled) return position;

      // Round each coordinate to nearest grid multiple
      return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };
    },
    [gridSize, enabled]
  );

  // =====================================
  // HOOK EXPORTS
  // =====================================
  return { snapToGrid };
}
