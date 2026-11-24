import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import type { Node } from "reactflow";
import { HistoryStore } from "./historyState";

/**
 * Records independent node-history stacks for each page and exposes keyboard
 * and menu actions without reading mutable refs during render.
 */
export function useHistory(
  nodes: Node[],
  setNodes: (nodes: Node[]) => void,
  historyKey: string
) {
  const [history] = useState(() => new HistoryStore<Node[]>(50));
  const availability = useSyncExternalStore(
    history.subscribe,
    history.getSnapshot,
    history.getSnapshot
  );

  useEffect(() => {
    history.record(historyKey, nodes);
  }, [history, historyKey, nodes]);

  const undo = useCallback(() => {
    const previous = history.undo();
    if (previous) setNodes(previous);
  }, [history, setNodes]);

  const redo = useCallback(() => {
    const next = history.redo();
    if (next) setNodes(next);
  }, [history, setNodes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "y" || (event.key === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  return {
    undo,
    redo,
    canUndo: availability.canUndo,
    canRedo: availability.canRedo,
  };
}
