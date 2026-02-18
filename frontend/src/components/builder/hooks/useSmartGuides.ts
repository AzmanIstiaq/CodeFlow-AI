/**
 * useSmartGuides Hook
 *
 * Implements intelligent visual alignment guides and snapping for the canvas.
 * Detects alignment opportunities between nodes and snaps them into place for clean layouts.
 *
 * Key Features:
 * 1. Alignment Detection: Vertical (left/center/right) and horizontal (top/center/bottom)
 * 2. Even Spacing: Detects when dragged node creates equal spacing between others
 * 3. Frame Snapping: Column boundaries and frame edges for structured layouts
 * 4. Grid Snap: Optional grid-based alignment
 * 5. Modifier Key Override: Holding key disables all snapping (fine-grained positioning)
 *
 * Visual Feedback:
 * - activeGuides state contains list of guide lines to render
 * - Each guide has position, type (vertical/horizontal), and snap target (left/center/right)
 *
 * Performance Considerations:
 * - Uses refs for threshold/grid settings to avoid unnecessary re-renders
 * - Caches bounds calculations with useCallback
 * - Only shows guides for nodes in same parent frame
 * - Deduplicates guides at same position
 *
 * Frame Model:
 * - Sections are 1280px wide with column subdivisions
 * - Child nodes use _ownedByColumn metadata to indicate column ownership
 * - Smart guides only snap nodes within the same column/parent frame
 */

import { useState, useCallback, useRef } from "react";
import type { Node } from "reactflow";
import type { ReactFlowInstance } from "reactflow";

// ===== CONSTANTS & TYPES =====
const DEFAULT_SNAP_THRESHOLD = 5; // pixels
const DEFAULT_GRID_SIZE = 16; // pixels

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface GuideLine {
  position: number;
  type: "vertical" | "horizontal";
  snapTarget?: "left" | "right" | "center" | "top" | "bottom";
  distance?: number; // Distance label for measurement guides
  spacing?: boolean; // True if this is an equal spacing guide
}

interface GuideWithBounds {
  vertical: GuideLine[];
  horizontal: GuideLine[];
  frameBounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

interface SnapResult {
  x: number;
  y: number;
  snapped: boolean;
}

export function useSmartGuides(
  nodes: Node[],
  reactFlowInstance?: ReactFlowInstance
) {
  // Hook contract: computes visual guide lines and optional snap positions during drag.
  // Keep guide detection + snapping behavior centralized here for editor consistency.
  const [activeGuides, setActiveGuides] = useState<GuideWithBounds>({
    vertical: [],
    horizontal: [],
  });

  // Use refs for settings that don't need to trigger re-renders
  const snapThresholdRef = useRef(DEFAULT_SNAP_THRESHOLD);
  const gridSizeRef = useRef(DEFAULT_GRID_SIZE);
  const enableGridSnapRef = useRef(false);
  const overrideKeyPressedRef = useRef(false);

  // =====================================
  // BOUND CALCULATION
  // =====================================
  // Find the immediate parent frame/section for a node
  const getParentFrame = useCallback(
    (node: Node): Node | null => {
      const parentId = node.data?._ownedByColumn;
      if (!parentId) return null;
      return (
        nodes.find((n) => n.id === parentId && n.type === "section") || null
      );
    },
    [nodes]
  );

  /**
   * Calculate bounding box for a node
   *
   * Uses ReactFlow's positionAbsolute for accuracy (already includes parent transforms)
   * Falls back to calculating from position + parent position if positionAbsolute unavailable
   * Returns null if node has no dimensions
   */
  const getBounds = useCallback(
    (node: Node, position?: { x: number; y: number }): Bounds | null => {
      // Try node.width/height first, then fall back to data.width/height
      const width = (node.width ?? (node.data as any)?.width) || 0;
      const height = (node.height ?? (node.data as any)?.height) || 0;

      if (width === 0 || height === 0) return null;

      let x: number, y: number;

      if (position) {
        // If position is provided, use it directly (already in absolute coordinates)
        x = position.x;
        y = position.y;
      } else {
        // ALWAYS use ReactFlow's positionAbsolute if available
        // ReactFlow calculates this correctly, accounting for all transforms
        if (node.positionAbsolute) {
          x = node.positionAbsolute.x;
          y = node.positionAbsolute.y;
        } else {
          // Fallback: if positionAbsolute is not available, calculate it
          // This should only happen in edge cases
          const parentFrame = getParentFrame(node);
          if (parentFrame) {
            const frameReactFlowNode = reactFlowInstance?.getNode(
              parentFrame.id
            );
            const framePos =
              frameReactFlowNode?.positionAbsolute ||
              parentFrame.positionAbsolute ||
              parentFrame.position;
            x = framePos.x + node.position.x;
            y = framePos.y + node.position.y;
          } else {
            x = node.position.x;
            y = node.position.y;
          }
        }
      }

      return {
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
        centerX: x + width / 2,
        centerY: y + height / 2,
        width,
        height,
      };
    },
    [getParentFrame]
  );

  // Get all reference lines for a bounds object
  const getReferenceLines = useCallback((bounds: Bounds) => {
    return {
      vertical: [bounds.left, bounds.centerX, bounds.right],
      horizontal: [bounds.top, bounds.centerY, bounds.bottom],
    };
  }, []);

  // =====================================
  // EVEN SPACING DETECTION
  // =====================================
  /**
   * Detect when dragged node creates equal spacing between other nodes
   *
   * Algorithm:
   * 1. For each pair of adjacent nodes, calculate gap between them
   * 2. Check if dragged node's position would create same gap
   * 3. Mark as spacing guide if within threshold
   *
   * This creates professional-looking layouts with consistent spacing
   */
  const detectEvenSpacing = useCallback(
    (
      draggedBounds: Bounds,
      otherNodes: Node[],
      draggedNodeId: string,
      draggedNodeParentId?: string
    ) => {
      const spacingGuides: GuideLine[] = [];
      const threshold = snapThresholdRef.current;

      // Get all nodes in the same parent frame, sorted by position
      const relevantNodes = otherNodes
        .filter((n) => {
          if (n.id === draggedNodeId || n.type === "section") return false;
          const nodeParentId = n.data?._ownedByColumn;
          if (draggedNodeParentId && nodeParentId !== draggedNodeParentId)
            return false;
          if (!draggedNodeParentId && nodeParentId) return false; // Dragged node is not in frame, but other node is
          return true;
        })
        .map((n) => {
          const bounds = getBounds(n);
          return bounds ? { node: n, bounds } : null;
        })
        .filter(
          (item): item is { node: Node; bounds: Bounds } => item !== null
        );

      // Check horizontal spacing (vertical guides)
      const sortedByX = [...relevantNodes].sort(
        (a, b) => a.bounds.left - b.bounds.left
      );

      for (let i = 0; i < sortedByX.length - 1; i++) {
        const nodeA = sortedByX[i];
        const nodeB = sortedByX[i + 1];
        const gap1 = nodeB.bounds.left - nodeA.bounds.right;

        // Check if dragged node could create equal spacing
        if (
          Math.abs(draggedBounds.right - nodeA.bounds.right - gap1) < threshold
        ) {
          const targetX = nodeA.bounds.right + gap1;
          if (Math.abs(draggedBounds.left - targetX) < threshold) {
            spacingGuides.push({
              position: targetX,
              type: "vertical",
              snapTarget: "left",
              spacing: true,
            });
          }
        }
        if (
          Math.abs(draggedBounds.left - nodeB.bounds.left + gap1) < threshold
        ) {
          const targetX = nodeB.bounds.left - gap1;
          if (Math.abs(draggedBounds.right - targetX) < threshold) {
            spacingGuides.push({
              position: targetX,
              type: "vertical",
              snapTarget: "right",
              spacing: true,
            });
          }
        }

        // Check if dragged node is between two nodes creating equal spacing
        if (
          draggedBounds.left > nodeA.bounds.right &&
          draggedBounds.right < nodeB.bounds.left
        ) {
          const gap1 = draggedBounds.left - nodeA.bounds.right;
          const gap2 = nodeB.bounds.left - draggedBounds.right;
          if (Math.abs(gap1 - gap2) < threshold) {
            spacingGuides.push({
              position: nodeA.bounds.right + gap1,
              type: "vertical",
              snapTarget: "left",
              spacing: true,
            });
          }
        }
      }

      // Check vertical spacing (horizontal guides)
      const sortedByY = [...relevantNodes].sort(
        (a, b) => a.bounds.top - b.bounds.top
      );

      for (let i = 0; i < sortedByY.length - 1; i++) {
        const nodeA = sortedByY[i];
        const nodeB = sortedByY[i + 1];
        const gap1 = nodeB.bounds.top - nodeA.bounds.bottom;

        if (
          Math.abs(draggedBounds.bottom - nodeA.bounds.bottom - gap1) <
          threshold
        ) {
          const targetY = nodeA.bounds.bottom + gap1;
          if (Math.abs(draggedBounds.top - targetY) < threshold) {
            spacingGuides.push({
              position: targetY,
              type: "horizontal",
              snapTarget: "top",
              spacing: true,
            });
          }
        }
        if (Math.abs(draggedBounds.top - nodeB.bounds.top + gap1) < threshold) {
          const targetY = nodeB.bounds.top - gap1;
          if (Math.abs(draggedBounds.bottom - targetY) < threshold) {
            spacingGuides.push({
              position: targetY,
              type: "horizontal",
              snapTarget: "bottom",
              spacing: true,
            });
          }
        }

        if (
          draggedBounds.top > nodeA.bounds.bottom &&
          draggedBounds.bottom < nodeB.bounds.top
        ) {
          const gap1 = draggedBounds.top - nodeA.bounds.bottom;
          const gap2 = nodeB.bounds.top - draggedBounds.bottom;
          if (Math.abs(gap1 - gap2) < threshold) {
            spacingGuides.push({
              position: nodeA.bounds.bottom + gap1,
              type: "horizontal",
              snapTarget: "top",
              spacing: true,
            });
          }
        }
      }

      return spacingGuides;
    },
    [getBounds]
  );

  // =====================================
  // GUIDE DETECTION
  // =====================================
  /**
   * Detect all applicable guide lines for a dragged node
   *
   * Algorithm:
   * 1. Establish frame bounds (parent section or canvas area)
   * 2. Collect reference lines from all sibling nodes in same frame
   * 3. For each reference line, calculate distances to dragged node edges/center
   * 4. If distance < threshold, create guide line
   * 5. Add spacing guides and frame boundary guides
   * 6. Deduplicate guides at same position
   *
   * Returns: Object with vertical and horizontal guides, plus frame bounds
   */
  const detectGuides = useCallback(
    (draggedNode: Node, position?: { x: number; y: number }) => {
      // Skip detection if override key is pressed (user wants fine control)
      if (overrideKeyPressedRef.current) {
        return { vertical: [], horizontal: [] };
      }

      const draggedBounds = getBounds(draggedNode, position);
      if (!draggedBounds) return { vertical: [], horizontal: [] };

      const guides: GuideWithBounds = { vertical: [], horizontal: [] };
      const threshold = snapThresholdRef.current;

      // Find the immediate parent frame for the dragged node
      const parentFrame = getParentFrame(draggedNode);

      // Set frame bounds - use parent frame if available, otherwise find any section
      let frameNode = parentFrame;
      if (!frameNode) {
        // Fallback: find the first section node
        frameNode = nodes.find((n) => n.type === "section") || null;
      }

      // Section nodes have fixed width of 1280px (see SectionNode.tsx)
      // Height is calculated dynamically, default to 720px
      const frameWidth = 1280; // Fixed width for sections
      const frameHeight =
        frameNode?.height ?? (frameNode?.data as any)?.height ?? 720;

      if (frameNode) {
        // Get frame position from ReactFlow instance for accuracy
        const frameReactFlowNode = reactFlowInstance?.getNode(frameNode.id);
        const framePos =
          frameReactFlowNode?.positionAbsolute ||
          frameNode.positionAbsolute ||
          frameNode.position;

        // IMPORTANT: The section node uses margin: "0 auto" which centers it visually,
        // but ReactFlow's position is the actual DOM position (top-left corner).
        // We need to use the ACTUAL position where the frame is rendered, not the visual center.
        // Since child nodes use positions relative to the frame's actual position,
        // we should use framePos directly.

        guides.frameBounds = {
          left: framePos.x,
          top: framePos.y,
          right: framePos.x + frameWidth,
          bottom: framePos.y + frameHeight,
        };
      } else {
        // Fallback: calculate bounds from all visible nodes or use a large area
        const allBounds = nodes
          .filter((n) => {
            if (!n.positionAbsolute || n.type === "section") return false;
            const w = n.width ?? (n.data as any)?.width;
            const h = n.height ?? (n.data as any)?.height;
            return w && h;
          })
          .map((n) => getBounds(n))
          .filter((b): b is Bounds => b !== null);

        if (allBounds.length > 0) {
          const minX = Math.min(...allBounds.map((b) => b.left));
          const maxX = Math.max(...allBounds.map((b) => b.right));
          const minY = Math.min(...allBounds.map((b) => b.top));
          const maxY = Math.max(...allBounds.map((b) => b.bottom));

          // Add padding around the bounds
          const padding = 500;
          guides.frameBounds = {
            left: minX - padding,
            top: minY - padding,
            right: maxX + padding,
            bottom: maxY + padding,
          };
        } else {
          // Ultimate fallback: use dragged node bounds with large padding
          guides.frameBounds = {
            left: draggedBounds.left - 1000,
            top: draggedBounds.top - 1000,
            right: draggedBounds.right + 1000,
            bottom: draggedBounds.bottom + 1000,
          };
        }
      }

      // Collect all reference lines from other nodes
      const verticalLines: Map<number, { target: string; distance?: number }> =
        new Map();
      const horizontalLines: Map<
        number,
        { target: string; distance?: number }
      > = new Map();

      // Get the parent frame ID to filter nodes in the same frame
      const draggedNodeParentId = draggedNode.data?._ownedByColumn;

      nodes.forEach((node) => {
        if (node.id === draggedNode.id) return;
        if (node.type === "section") return;

        // Only show guides for nodes in the same parent frame
        const nodeParentId = node.data?._ownedByColumn;
        if (draggedNodeParentId && nodeParentId !== draggedNodeParentId) return;
        if (!draggedNodeParentId && nodeParentId) return; // Dragged node is not in frame, but other node is

        const nodeBounds = getBounds(node);
        if (!nodeBounds) return;

        const refLines = getReferenceLines(nodeBounds);

        // Check vertical alignment (left, center, right)
        refLines.vertical.forEach((x) => {
          const distLeft = Math.abs(draggedBounds.left - x);
          const distRight = Math.abs(draggedBounds.right - x);
          const distCenter = Math.abs(draggedBounds.centerX - x);

          if (distLeft < threshold) {
            const existing = verticalLines.get(x);
            if (!existing || distLeft < (existing.distance || Infinity)) {
              verticalLines.set(x, {
                target: "left",
                distance: distLeft,
              });
            }
          }
          if (distRight < threshold) {
            const existing = verticalLines.get(x);
            if (!existing || distRight < (existing.distance || Infinity)) {
              verticalLines.set(x, {
                target: "right",
                distance: distRight,
              });
            }
          }
          if (distCenter < threshold) {
            const existing = verticalLines.get(x);
            if (!existing || distCenter < (existing.distance || Infinity)) {
              verticalLines.set(x, {
                target: "center",
                distance: distCenter,
              });
            }
          }
        });

        // Check horizontal alignment (top, center, bottom)
        refLines.horizontal.forEach((y) => {
          const distTop = Math.abs(draggedBounds.top - y);
          const distBottom = Math.abs(draggedBounds.bottom - y);
          const distCenter = Math.abs(draggedBounds.centerY - y);

          if (distTop < threshold) {
            const existing = horizontalLines.get(y);
            if (!existing || distTop < (existing.distance || Infinity)) {
              horizontalLines.set(y, {
                target: "top",
                distance: distTop,
              });
            }
          }
          if (distBottom < threshold) {
            const existing = horizontalLines.get(y);
            if (!existing || distBottom < (existing.distance || Infinity)) {
              horizontalLines.set(y, {
                target: "bottom",
                distance: distBottom,
              });
            }
          }
          if (distCenter < threshold) {
            const existing = horizontalLines.get(y);
            if (!existing || distCenter < (existing.distance || Infinity)) {
              horizontalLines.set(y, {
                target: "center",
                distance: distCenter,
              });
            }
          }
        });
      });

      // Convert maps to guide lines
      verticalLines.forEach((info, position) => {
        guides.vertical.push({
          position,
          type: "vertical",
          snapTarget: info.target as "left" | "right" | "center",
          distance: info.distance,
        });
      });

      horizontalLines.forEach((info, position) => {
        guides.horizontal.push({
          position,
          type: "horizontal",
          snapTarget: info.target as "top" | "bottom" | "center",
          distance: info.distance,
        });
      });

      // Add even spacing guides
      const spacingGuides = detectEvenSpacing(
        draggedBounds,
        nodes,
        draggedNode.id,
        draggedNodeParentId
      );
      spacingGuides.forEach((guide) => {
        if (guide.type === "vertical") {
          guides.vertical.push(guide);
        } else {
          guides.horizontal.push(guide);
        }
      });

      // Add frame/column guides if applicable
      if (frameNode && guides.frameBounds) {
        const frameBounds = guides.frameBounds;
        const columnIndex = draggedNode.data?._columnIndex ?? 0;
        const columnCount = frameNode.data?.columns?.count ?? 1;
        const columnWidth = frameWidth / columnCount;
        const columnPadding = 32;

        const columnOuterLeft = frameBounds.left + columnWidth * columnIndex;
        const columnLeft = columnOuterLeft + columnPadding;
        const columnRight = columnOuterLeft + columnWidth - columnPadding;
        const columnCenterX = columnOuterLeft + columnWidth / 2;
        const frameCenterY =
          frameBounds.top + (frameBounds.bottom - frameBounds.top) / 2;

        // Check column boundaries
        if (Math.abs(draggedBounds.left - columnLeft) < threshold) {
          guides.vertical.push({
            position: columnLeft,
            type: "vertical",
            snapTarget: "left",
          });
        }
        if (Math.abs(draggedBounds.right - columnRight) < threshold) {
          guides.vertical.push({
            position: columnRight,
            type: "vertical",
            snapTarget: "right",
          });
        }
        if (Math.abs(draggedBounds.centerX - columnCenterX) < threshold) {
          guides.vertical.push({
            position: columnCenterX,
            type: "vertical",
            snapTarget: "center",
          });
        }
        if (Math.abs(draggedBounds.top - frameBounds.top) < threshold) {
          guides.horizontal.push({
            position: frameBounds.top,
            type: "horizontal",
            snapTarget: "top",
          });
        }
        if (Math.abs(draggedBounds.bottom - frameBounds.bottom) < threshold) {
          guides.horizontal.push({
            position: frameBounds.bottom,
            type: "horizontal",
            snapTarget: "bottom",
          });
        }
        if (Math.abs(draggedBounds.centerY - frameCenterY) < threshold) {
          guides.horizontal.push({
            position: frameCenterY,
            type: "horizontal",
            snapTarget: "center",
          });
        }
      }

      // Remove duplicates (same position)
      guides.vertical = guides.vertical.filter(
        (g, i, arr) =>
          arr.findIndex((g2) => Math.abs(g2.position - g.position) < 0.1) === i
      );
      guides.horizontal = guides.horizontal.filter(
        (g, i, arr) =>
          arr.findIndex((g2) => Math.abs(g2.position - g.position) < 0.1) === i
      );

      return guides;
    },
    [nodes, getBounds, getReferenceLines, detectEvenSpacing]
  );

  // =====================================
  // SNAPPING LOGIC
  // =====================================
  /**
   * Apply snapping to a dragged node's position
   *
   * Process:
   * 1. Skip if override key pressed (user wants free movement)
   * 2. Apply grid snapping if enabled (coarser alignment)
   * 3. Detect guide lines at current position
   * 4. For each guide, calculate distance from node edge/center to guide
   * 5. Snap to guide if distance < threshold
   * 6. Return final position and whether snapping occurred
   *
   * Note: Grid snap is applied first, then guides snap to refined position
   */
  const snapToGuides = useCallback(
    (draggedNode: Node, position: { x: number; y: number }): SnapResult => {
      const nodeWidth = draggedNode.width ?? (draggedNode.data as any)?.width;
      const nodeHeight =
        draggedNode.height ?? (draggedNode.data as any)?.height;

      // Early exit if override key pressed or node has no dimensions
      if (overrideKeyPressedRef.current || !nodeWidth || !nodeHeight) {
        return { ...position, snapped: false };
      }

      let snappedX = position.x;
      let snappedY = position.y;
      let snapped = false;

      // Grid snapping
      if (enableGridSnapRef.current) {
        const gridSize = gridSizeRef.current;
        snappedX = Math.round(position.x / gridSize) * gridSize;
        snappedY = Math.round(position.y / gridSize) * gridSize;
        if (snappedX !== position.x || snappedY !== position.y) {
          snapped = true;
        }
      }

      const guides = detectGuides(draggedNode, { x: snappedX, y: snappedY });
      const threshold = snapThresholdRef.current;

      const draggedBounds = {
        left: snappedX,
        right: snappedX + nodeWidth,
        centerX: snappedX + nodeWidth / 2,
        top: snappedY,
        bottom: snappedY + nodeHeight,
        centerY: snappedY + nodeHeight / 2,
      };

      // Snap to vertical guides
      for (const guide of guides.vertical) {
        const { position: guideX, snapTarget } = guide;

        if (
          snapTarget === "left" &&
          Math.abs(draggedBounds.left - guideX) < threshold
        ) {
          snappedX = guideX;
          snapped = true;
          break;
        }
        if (
          snapTarget === "right" &&
          Math.abs(draggedBounds.right - guideX) < threshold
        ) {
          snappedX = guideX - nodeWidth;
          snapped = true;
          break;
        }
        if (
          snapTarget === "center" &&
          Math.abs(draggedBounds.centerX - guideX) < threshold
        ) {
          snappedX = guideX - nodeWidth / 2;
          snapped = true;
          break;
        }
      }

      // Snap to horizontal guides
      for (const guide of guides.horizontal) {
        const { position: guideY, snapTarget } = guide;

        if (
          snapTarget === "top" &&
          Math.abs(draggedBounds.top - guideY) < threshold
        ) {
          snappedY = guideY;
          snapped = true;
          break;
        }
        if (
          snapTarget === "bottom" &&
          Math.abs(draggedBounds.bottom - guideY) < threshold
        ) {
          snappedY = guideY - nodeHeight;
          snapped = true;
          break;
        }
        if (
          snapTarget === "center" &&
          Math.abs(draggedBounds.centerY - guideY) < threshold
        ) {
          snappedY = guideY - nodeHeight / 2;
          snapped = true;
          break;
        }
      }

      return { x: snappedX, y: snappedY, snapped };
    },
    [detectGuides, enableGridSnapRef.current]
  );

  const handleDrag = useCallback(
    (node: Node) => {
      const guides = detectGuides(node);
      setActiveGuides(guides);
    },
    [detectGuides]
  );

  /**
   * Clear all visible guides from canvas
   * Called when drag ends or when snapping is disabled
   */
  const clearGuides = useCallback(() => {
    setActiveGuides({ vertical: [], horizontal: [] });
  }, []);

  // =====================================
  // CONFIGURATION METHODS
  // =====================================
  /**
   * Set snap threshold in pixels
   * Guides trigger when cursor is within this distance
   * Default: 5px
   */
  const setSnapThreshold = useCallback((threshold: number) => {
    snapThresholdRef.current = threshold;
  }, []);

  /**
   * Enable/disable grid snapping and set grid size
   * When enabled, nodes snap to nearest grid multiple
   *
   * @param enabled - Whether grid snapping is active
   * @param size - Grid size in pixels (if not provided, keeps current size)
   */
  const setGridSnap = useCallback((enabled: boolean, size?: number) => {
    enableGridSnapRef.current = enabled;
    if (size !== undefined) {
      gridSizeRef.current = size;
    }
  }, []);

  /**
   * Set modifier key state (e.g., Alt or Shift held)
   * When true, disables all snapping for fine-grained positioning
   */
  const setOverrideKey = useCallback((pressed: boolean) => {
    overrideKeyPressedRef.current = pressed;
  }, []);

  // =====================================
  // HOOK EXPORTS
  // =====================================
  return {
    activeGuides,
    handleDrag,
    clearGuides,
    snapToGuides,
    setSnapThreshold,
    setGridSnap,
    setOverrideKey,
  };
}