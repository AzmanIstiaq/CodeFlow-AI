/**
 * useCanvasDrawing Hook
 *
 * Manages free-form canvas drawing mode.
 * Users can press ESC to enter drawing mode, then drag to create shapes/containers.
 *
 * Flow:
 * 1. User clicks ESC key → drawingMode enabled
 * 2. User clicks canvas → records start position
 * 3. User drags → shows preview box during drag
 * 4. User releases → creates node if size > minimum threshold
 *
 * Features:
 * - Drag-to-create shapes on canvas
 * - Visual preview during dragging
 * - ESC to cancel
 * - Minimum size threshold (10px) to prevent accidental tiny nodes
 * - Uses ReactFlow's coordinate system (screenToFlowPosition)
 *
 * Props:
 * - drawingMode: Current drawing state or null
 * - setDrawingMode: Update drawing state
 * - drawingPreview: Visual preview rect during drag
 * - setDrawingPreview: Update preview
 * - isDrawingRef: Ref to track active drag
 * - reactFlowInstance: ReactFlow instance for coordinate conversion
 * - setNodes: Add new node to canvas
 * - getDefaultNodeData: Generate default properties for node type
 *
 * Events:
 * - ESC key: Cancel mode
 * - Canvas click: Start drawing
 * - Mouse drag: Update preview
 * - Mouse up: Finalize node (or cancel if too small)
 */

import { useEffect } from "react";
import type { ReactFlowInstance } from "reactflow";

interface UseCanvasDrawingProps {
  placementMode: { type: string; label: string } | null;
  setPlacementMode: (mode: { type: string; label: string } | null) => void;
  drawingMode: {
    type: string;
    label: string;
    start: { x: number; y: number };
  } | null;
  setDrawingMode: (
    mode: {
      type: string;
      label: string;
      start: { x: number; y: number };
    } | null
  ) => void;
  drawingPreview: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  setDrawingPreview: (
    preview: { x: number; y: number; width: number; height: number } | null
  ) => void;
  isDrawingRef: React.MutableRefObject<boolean>;
  reactFlowInstance: ReactFlowInstance;
  setNodes: (updater: any) => void;
  setSelectedNode: (node: any) => void;
  setSelectedNodes: (nodes: any[]) => void;
  getDefaultNodeData: (type: string, label: string) => any;
}

export function useCanvasDrawing({
  placementMode,
  setPlacementMode,
  drawingMode,
  setDrawingMode,
  drawingPreview,
  setDrawingPreview,
  isDrawingRef,
  reactFlowInstance,
  setNodes,
  setSelectedNode,
  setSelectedNodes,
  getDefaultNodeData,
}: UseCanvasDrawingProps) {
  // =====================================
  // ESC KEY HANDLING
  // =====================================
  // Cancel placement or drawing mode when user presses ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (placementMode) setPlacementMode(null);
        if (drawingMode) {
          setDrawingMode(null);
          setDrawingPreview(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placementMode, drawingMode]);

  // =====================================
  // DRAWING MODE HANDLERS
  // =====================================
  // Handle drag-to-create shapes on canvas
  useEffect(() => {
    if (!drawingMode) return;

    /**
     * Mouse down: Mark start of drag, record position
     * Converts screen coordinates to flow coordinates
     */
    const handleMouseDown = (event: MouseEvent) => {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setDrawingMode({ ...drawingMode, start: position });
      isDrawingRef.current = true;
    };

    /**
     * Mouse move: Update preview box as user drags
     * Calculates dimensions from start to current position
     * Ensures consistent corner (top-left) regardless of drag direction
     */
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawingRef.current || !drawingMode.start) return;

      const currentPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Normalize coordinates to top-left corner
      const x = Math.min(drawingMode.start.x, currentPos.x);
      const y = Math.min(drawingMode.start.y, currentPos.y);
      const width = Math.abs(currentPos.x - drawingMode.start.x);
      const height = Math.abs(currentPos.y - drawingMode.start.y);

      setDrawingPreview({ x, y, width, height });
    };

    /**
     * Mouse up: Finalize drawing
     * Creates node if dimensions exceed minimum threshold (10x10)
     * Prevents accidental tiny nodes from quick clicks
     */
    const handleMouseUp = () => {
      isDrawingRef.current = false;
      // ===== NODE CREATION =====
      // Validate size before creating node
      if (
        !drawingMode.start ||
        !drawingPreview ||
        drawingPreview.width < 10 ||
        drawingPreview.height < 10
      ) {
        setDrawingMode(null);
        setDrawingPreview(null);
        return;
      }

      // Create unique node ID using timestamp
      const nodeId = `${drawingMode.type}-${Date.now()}`;
      const newNode: any = {
        id: nodeId,
        type: drawingMode.type,
        // Position from top-left of drawn preview
        position: { x: drawingPreview.x, y: drawingPreview.y },
        draggable: true,
        // Apply drawn dimensions to node style
        style: {
          width: Math.round(drawingPreview.width),
          height: Math.round(drawingPreview.height),
        },
        // Apply default data + dimensions to node data (used by node components)
        data: {
          ...getDefaultNodeData(drawingMode.type, drawingMode.label),
          width: Math.round(drawingPreview.width),
          height: Math.round(drawingPreview.height),
        },
      };

      // Add node to canvas and select it
      setNodes((nds: any) => [...nds, newNode]);
      setDrawingMode(null);
      setDrawingPreview(null);
      // Highlight newly created node
      setSelectedNode(newNode);
      setSelectedNodes([newNode]);
    };

    // =====================================
    // GLOBAL MOUSE EVENT LISTENERS
    // =====================================
    // Register global mouse handlers for drawing mode
    // Uses global listeners to capture dragging outside canvas area
    // Essential for smooth dragging experience when user moves cursor past canvas edges
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    drawingMode,
    drawingPreview,
    reactFlowInstance,
    setNodes,
    setSelectedNode,
    setSelectedNodes,
  ]);
}
