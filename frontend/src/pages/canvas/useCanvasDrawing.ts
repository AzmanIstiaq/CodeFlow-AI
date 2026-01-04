import { useEffect } from "react";
import type { ReactFlowInstance } from "reactflow";

interface UseCanvasDrawingProps {
  placementMode: { type: string; label: string } | null;
  setPlacementMode: (mode: { type: string; label: string } | null) => void;
  drawingMode: { type: string; label: string; start: { x: number; y: number } } | null;
  setDrawingMode: (mode: { type: string; label: string; start: { x: number; y: number } } | null) => void;
  drawingPreview: { x: number; y: number; width: number; height: number } | null;
  setDrawingPreview: (preview: { x: number; y: number; width: number; height: number } | null) => void;
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
  // Handle ESC key to cancel placement mode or drawing mode
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

  // Drawing mode handlers using global mouse events
  useEffect(() => {
    if (!drawingMode) return;

    const handleMouseDown = (event: MouseEvent) => {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setDrawingMode({ ...drawingMode, start: position });
      isDrawingRef.current = true;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawingRef.current || !drawingMode.start) return;
      
      const currentPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const x = Math.min(drawingMode.start.x, currentPos.x);
      const y = Math.min(drawingMode.start.y, currentPos.y);
      const width = Math.abs(currentPos.x - drawingMode.start.x);
      const height = Math.abs(currentPos.y - drawingMode.start.y);
      
      setDrawingPreview({ x, y, width, height });
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
      if (!drawingMode.start || !drawingPreview || drawingPreview.width < 10 || drawingPreview.height < 10) {
        setDrawingMode(null);
        setDrawingPreview(null);
        return;
      }
      
      const nodeId = `${drawingMode.type}-${Date.now()}`;
      const newNode: any = {
        id: nodeId,
        type: drawingMode.type,
        position: { x: drawingPreview.x, y: drawingPreview.y },
        draggable: true,
        style: {
          width: Math.round(drawingPreview.width),
          height: Math.round(drawingPreview.height),
        },
        data: {
          ...getDefaultNodeData(drawingMode.type, drawingMode.label),
          width: Math.round(drawingPreview.width),
          height: Math.round(drawingPreview.height),
        },
      };
      
      setNodes((nds: any) => [...nds, newNode]);
      setDrawingMode(null);
      setDrawingPreview(null);
      setSelectedNode(newNode);
      setSelectedNodes([newNode]);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drawingMode, drawingPreview, reactFlowInstance, setNodes, setSelectedNode, setSelectedNodes]);
}
