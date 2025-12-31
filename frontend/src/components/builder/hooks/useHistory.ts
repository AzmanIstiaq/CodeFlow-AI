import { useRef, useCallback, useEffect } from "react";
import type { Node } from "reactflow";

interface HistoryState {
  nodes: Node[];
  timestamp: number;
}

export function useHistory(nodes: Node[], setNodes: (nodes: Node[]) => void) {
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const lastSavedRef = useRef<string>("");

  // Save state to history when nodes change
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const nodesString = JSON.stringify(nodes);
    if (nodesString === lastSavedRef.current) return;

    lastSavedRef.current = nodesString;
    
    // Remove any states after current index
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push({
      nodes: JSON.parse(nodesString),
      timestamp: Date.now(),
    });
    
    // Keep only last 50 states
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current++;
    }
  }, [nodes]);

  // Undo
  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      isUndoRedoRef.current = true;
      const newIndex = currentIndexRef.current - 1;
      currentIndexRef.current = newIndex;
      const state = historyRef.current[newIndex];
      lastSavedRef.current = JSON.stringify(state.nodes);
      setNodes(JSON.parse(JSON.stringify(state.nodes)));
    }
  }, [setNodes]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = currentIndexRef.current + 1;
      currentIndexRef.current = newIndex;
      const state = historyRef.current[newIndex];
      lastSavedRef.current = JSON.stringify(state.nodes);
      setNodes(JSON.parse(JSON.stringify(state.nodes)));
    }
  }, [setNodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
  };
}
