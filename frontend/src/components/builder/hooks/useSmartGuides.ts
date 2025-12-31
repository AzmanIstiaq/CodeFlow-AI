import { useState, useCallback } from "react";
import type { Node } from "reactflow";

const SNAP_THRESHOLD = 5; // pixels

interface Guide {
  vertical: number[];
  horizontal: number[];
}

interface GuideWithBounds extends Guide {
  frameBounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

export function useSmartGuides(nodes: Node[]) {
  const [activeGuides, setActiveGuides] = useState<GuideWithBounds>({
    vertical: [],
    horizontal: [],
  });

  const detectGuides = useCallback(
    (draggedNode: Node) => {
      if (!draggedNode.positionAbsolute) return { vertical: [], horizontal: [] };

      const guides: GuideWithBounds = { vertical: [], horizontal: [] };
      
      const draggedBounds = {
        left: draggedNode.positionAbsolute.x,
        right: draggedNode.positionAbsolute.x + (draggedNode.width || 0),
        top: draggedNode.positionAbsolute.y,
        bottom: draggedNode.positionAbsolute.y + (draggedNode.height || 0),
        centerX: draggedNode.positionAbsolute.x + (draggedNode.width || 0) / 2,
        centerY: draggedNode.positionAbsolute.y + (draggedNode.height || 0) / 2,
      };
      
      // Find the frame/section this node belongs to
      const draggedNodeColumn = draggedNode.data?._ownedByColumn;
      const frameNode = nodes.find(n => n.id === draggedNodeColumn);
      
      // If node is in a column, set frame bounds for clipping and add column alignment guides
      if (frameNode && frameNode.positionAbsolute && frameNode.width && frameNode.height) {
        const frameBounds = {
          left: frameNode.positionAbsolute.x,
          top: frameNode.positionAbsolute.y,
          right: frameNode.positionAbsolute.x + frameNode.width,
          bottom: frameNode.positionAbsolute.y + frameNode.height,
        };
        guides.frameBounds = frameBounds;
        
        // Get column information
        const columnIndex = draggedNode.data?._columnIndex ?? 0;
        const columnCount = frameNode.data?.columns?.count ?? 1;
        const columnWidth = frameNode.width / columnCount;
        const columnPadding = 32; // Horizontal padding from ColumnsSectionNode
        
        // Calculate column boundaries (accounting for padding)
        const columnOuterLeft = frameBounds.left + (columnWidth * columnIndex);
        const columnOuterRight = columnOuterLeft + columnWidth;
        const columnLeft = columnOuterLeft + columnPadding; // Inner left edge (with padding)
        const columnRight = columnOuterRight - columnPadding; // Inner right edge (with padding)
        const columnCenterX = columnOuterLeft + columnWidth / 2; // Center of entire column
        
        // Add column boundary guides
        // Left edge of column
        if (Math.abs(draggedBounds.left - columnLeft) < SNAP_THRESHOLD) {
          guides.vertical.push(columnLeft);
        }
        if (Math.abs(draggedBounds.right - columnLeft) < SNAP_THRESHOLD) {
          guides.vertical.push(columnLeft);
        }
        
        // Right edge of column
        if (Math.abs(draggedBounds.left - columnRight) < SNAP_THRESHOLD) {
          guides.vertical.push(columnRight);
        }
        if (Math.abs(draggedBounds.right - columnRight) < SNAP_THRESHOLD) {
          guides.vertical.push(columnRight);
        }
        
        // Center of column (horizontal)
        if (Math.abs(draggedBounds.centerX - columnCenterX) < SNAP_THRESHOLD) {
          guides.vertical.push(columnCenterX);
        }
        
        // Top edge of frame
        if (Math.abs(draggedBounds.top - frameBounds.top) < SNAP_THRESHOLD) {
          guides.horizontal.push(frameBounds.top);
        }
        if (Math.abs(draggedBounds.bottom - frameBounds.top) < SNAP_THRESHOLD) {
          guides.horizontal.push(frameBounds.top);
        }
        
        // Bottom edge of frame
        if (Math.abs(draggedBounds.top - frameBounds.bottom) < SNAP_THRESHOLD) {
          guides.horizontal.push(frameBounds.bottom);
        }
        if (Math.abs(draggedBounds.bottom - frameBounds.bottom) < SNAP_THRESHOLD) {
          guides.horizontal.push(frameBounds.bottom);
        }
        
        // Center of frame (vertical)
        const frameCenterY = frameBounds.top + (frameBounds.bottom - frameBounds.top) / 2;
        if (Math.abs(draggedBounds.centerY - frameCenterY) < SNAP_THRESHOLD) {
          guides.horizontal.push(frameCenterY);
        }
      }

      // Check alignment with other nodes in the same frame only
      nodes.forEach((node) => {
        if (node.id === draggedNode.id || !node.positionAbsolute) return;
        if (node.type === "section") return; // Skip section nodes
        
        // Only show guides for nodes in the same column/frame
        if (draggedNodeColumn && node.data?._ownedByColumn !== draggedNodeColumn) return;

        const nodeBounds = {
          left: node.positionAbsolute.x,
          right: node.positionAbsolute.x + (node.width || 0),
          top: node.positionAbsolute.y,
          bottom: node.positionAbsolute.y + (node.height || 0),
          centerX: node.positionAbsolute.x + (node.width || 0) / 2,
          centerY: node.positionAbsolute.y + (node.height || 0) / 2,
        };

        // Vertical alignment checks
        if (Math.abs(draggedBounds.left - nodeBounds.left) < SNAP_THRESHOLD) {
          guides.vertical.push(nodeBounds.left);
        }
        if (Math.abs(draggedBounds.right - nodeBounds.right) < SNAP_THRESHOLD) {
          guides.vertical.push(nodeBounds.right);
        }
        if (Math.abs(draggedBounds.centerX - nodeBounds.centerX) < SNAP_THRESHOLD) {
          guides.vertical.push(nodeBounds.centerX);
        }
        if (Math.abs(draggedBounds.left - nodeBounds.right) < SNAP_THRESHOLD) {
          guides.vertical.push(nodeBounds.right);
        }
        if (Math.abs(draggedBounds.right - nodeBounds.left) < SNAP_THRESHOLD) {
          guides.vertical.push(nodeBounds.left);
        }

        // Horizontal alignment checks
        if (Math.abs(draggedBounds.top - nodeBounds.top) < SNAP_THRESHOLD) {
          guides.horizontal.push(nodeBounds.top);
        }
        if (Math.abs(draggedBounds.bottom - nodeBounds.bottom) < SNAP_THRESHOLD) {
          guides.horizontal.push(nodeBounds.bottom);
        }
        if (Math.abs(draggedBounds.centerY - nodeBounds.centerY) < SNAP_THRESHOLD) {
          guides.horizontal.push(nodeBounds.centerY);
        }
        if (Math.abs(draggedBounds.top - nodeBounds.bottom) < SNAP_THRESHOLD) {
          guides.horizontal.push(nodeBounds.bottom);
        }
        if (Math.abs(draggedBounds.bottom - nodeBounds.top) < SNAP_THRESHOLD) {
          guides.horizontal.push(nodeBounds.top);
        }
      });

      // Remove duplicates
      guides.vertical = [...new Set(guides.vertical)];
      guides.horizontal = [...new Set(guides.horizontal)];

      return guides;
    },
    [nodes]
  );

  const snapToGuides = useCallback(
    (draggedNode: Node, position: { x: number; y: number }) => {
      if (!draggedNode.width || !draggedNode.height) return position;

      const guides = detectGuides(draggedNode);
      let snappedX = position.x;
      let snappedY = position.y;

      const draggedBounds = {
        left: position.x,
        right: position.x + draggedNode.width,
        centerX: position.x + draggedNode.width / 2,
        top: position.y,
        bottom: position.y + draggedNode.height,
        centerY: position.y + draggedNode.height / 2,
      };

      // Snap to vertical guides
      for (const guideX of guides.vertical) {
        if (Math.abs(draggedBounds.left - guideX) < SNAP_THRESHOLD) {
          snappedX = guideX;
          break;
        }
        if (Math.abs(draggedBounds.right - guideX) < SNAP_THRESHOLD) {
          snappedX = guideX - draggedNode.width;
          break;
        }
        if (Math.abs(draggedBounds.centerX - guideX) < SNAP_THRESHOLD) {
          snappedX = guideX - draggedNode.width / 2;
          break;
        }
      }

      // Snap to horizontal guides
      for (const guideY of guides.horizontal) {
        if (Math.abs(draggedBounds.top - guideY) < SNAP_THRESHOLD) {
          snappedY = guideY;
          break;
        }
        if (Math.abs(draggedBounds.bottom - guideY) < SNAP_THRESHOLD) {
          snappedY = guideY - draggedNode.height;
          break;
        }
        if (Math.abs(draggedBounds.centerY - guideY) < SNAP_THRESHOLD) {
          snappedY = guideY - draggedNode.height / 2;
          break;
        }
      }

      return { x: snappedX, y: snappedY };
    },
    [detectGuides]
  );

  const handleDrag = useCallback(
    (node: Node) => {
      const guides = detectGuides(node);
      setActiveGuides(guides);
    },
    [detectGuides]
  );

  const clearGuides = useCallback(() => {
    setActiveGuides({ vertical: [], horizontal: [] });
  }, []);

  return {
    activeGuides,
    handleDrag,
    clearGuides,
    snapToGuides,
  };
}
