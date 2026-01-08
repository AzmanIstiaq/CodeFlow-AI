/**
 * useHistory Hook
 *
 * Implements undo/redo functionality for canvas state changes.
 *
 * Design:
 * - Maintains history stack with timestamped snapshots
 * - Limits history to last 50 states to prevent memory issues
 * - Distinguishes user actions from undo/redo operations
 * - Supports keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo)
 *
 * Key Details:
 * - Uses refs to avoid re-rendering on history changes
 * - Deduplicates consecutive identical states
 * - Clears redo stack when new action occurs after undo
 *
 * History Flow:
 * 1. User modifies nodes → useEffect detects change
 * 2. Skip if isUndoRedoRef is true (prevents history loops)
 * 3. Serialize nodes to JSON, compare to last saved state
 * 4. If different, push to history and increment index
 * 5. On undo/redo, set flag, restore state, clear flag
 */

import { useRef, useCallback, useEffect } from "react";
import type { Node } from "reactflow";

interface HistoryState {
  nodes: Node[];
  timestamp: number;
}

export function useHistory(nodes: Node[], setNodes: (nodes: Node[]) => void) {
  // =====================================
  // HISTORY STATE (REFS NOT STATE)
  // =====================================
  // Using refs instead of state to avoid re-renders
  // History is side-effect: updates to it don't need UI updates

  // Stack of saved node snapshots with timestamps
  const historyRef = useRef<HistoryState[]>([]);

  // Current position in history (0 = oldest, length-1 = newest)
  const currentIndexRef = useRef(-1);

  // Flag to distinguish undo/redo from normal saves
  // When true, useEffect skips saving (because change came from history restore, not user action)
  const isUndoRedoRef = useRef(false);

  // Last saved nodes as JSON string
  // Used for deduplication: if current nodes match last saved, skip saving
  const lastSavedRef = useRef<string>("");

  // =====================================
  // HISTORY RECORDING
  // =====================================
  /**
   * Save node state to history on every change
   *
   * Skipped if:
   * - isUndoRedoRef is true (change came from undo/redo, don't double-save)
   * - nodes haven't actually changed (JSON deduplication)
   *
   * Cleanup:
   * - Remove any future states if user acts after undo
   * - Keep only last 50 states
   */
  useEffect(() => {
    // Skip if this change came from undo/redo operation
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Serialize nodes to check for actual changes
    const nodesString = JSON.stringify(nodes);
    if (nodesString === lastSavedRef.current) return;

    // Update last saved reference
    lastSavedRef.current = nodesString;

    // Remove any states after current index
    // (if user undid something, then acted, discard the "future" states)
    historyRef.current = historyRef.current.slice(
      0,
      currentIndexRef.current + 1
    );

    // Add new state to history
    historyRef.current.push({
      nodes: JSON.parse(nodesString),
      timestamp: Date.now(),
    });

    // Keep only last 50 states to prevent memory leaks
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current++;
    }
  }, [nodes]);

  // =====================================
  // UNDO OPERATION
  // =====================================
  /**
   * Restore previous state from history
   *
   * Only works if currentIndex > 0 (not at oldest state)
   * Sets flag to skip re-recording the restoration
   */
  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      isUndoRedoRef.current = true;
      const newIndex = currentIndexRef.current - 1;
      currentIndexRef.current = newIndex;
      const state = historyRef.current[newIndex];
      lastSavedRef.current = JSON.stringify(state.nodes);
      // Deep clone to ensure React detects change
      setNodes(JSON.parse(JSON.stringify(state.nodes)));
    }
  }, [setNodes]);

  // =====================================
  // REDO OPERATION
  // =====================================
  /**
   * Restore next state from history
   *
   * Only works if currentIndex < length-1 (not at newest state)
   * Sets flag to skip re-recording the restoration
   */
  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = currentIndexRef.current + 1;
      currentIndexRef.current = newIndex;
      const state = historyRef.current[newIndex];
      lastSavedRef.current = JSON.stringify(state.nodes);
      // Deep clone to ensure React detects change
      setNodes(JSON.parse(JSON.stringify(state.nodes)));
    }
  }, [setNodes]);

  // =====================================
  // KEYBOARD SHORTCUTS
  // =====================================
  /**
   * Register global keyboard listeners for undo/redo
   * - Ctrl+Z (or Cmd+Z on Mac): Undo
   * - Ctrl+Y or Ctrl+Shift+Z: Redo
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd+Z without Shift
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z
      else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // =====================================
  // HOOK EXPORTS
  // =====================================
  return {
    undo,
    redo,
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
  };
}
