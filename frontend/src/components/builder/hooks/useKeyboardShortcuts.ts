import { useEffect } from "react";
import type { Node } from "reactflow";

interface UseKeyboardShortcutsProps {
  selectedNodes: Node[];
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onDeselect: () => void;
}

export function useKeyboardShortcuts({
  selectedNodes,
  onDelete,
  onDuplicate,
  onCopy,
  onPaste,
  onSelectAll,
  onDeselect,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodes.length > 0) {
        e.preventDefault();
        onDelete();
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            if (selectedNodes.length > 0) {
              onDuplicate();
            }
            break;
          case "c":
            if (selectedNodes.length > 0) {
              e.preventDefault();
              onCopy();
            }
            break;
          case "v":
            e.preventDefault();
            onPaste();
            break;
          case "a":
            e.preventDefault();
            onSelectAll();
            break;
        }
      }

      if (e.key === "Escape") {
        onDeselect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodes, onDelete, onDuplicate, onCopy, onPaste, onSelectAll, onDeselect]);
}
