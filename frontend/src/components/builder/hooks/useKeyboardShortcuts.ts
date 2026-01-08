/**
 * useKeyboardShortcuts Hook
 *
 * Captures keyboard events and delegates to action handlers.
 * Respects input field focus (doesn't trigger shortcuts while typing).
 *
 * Supported Shortcuts:
 * - Delete/Backspace: Delete selected nodes
 * - Ctrl/Cmd+D: Duplicate selected nodes
 * - Ctrl/Cmd+C: Copy selected nodes
 * - Ctrl/Cmd+V: Paste nodes from clipboard
 * - Ctrl/Cmd+A: Select all nodes
 * - Escape: Deselect all nodes
 *
 * Safety:
 * - Disables when user is typing in input/textarea/contentEditable
 * - Prevents default browser behavior for custom shortcuts
 */

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

      // =====================================
      // INPUT FIELD CHECK
      // =====================================
      // Don't trigger shortcuts if user is typing in input/textarea/contentEditable
      // This prevents accidentally deleting nodes while naming them
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField) return;

      // =====================================
      // DELETE SHORTCUT
      // =====================================
      // Delete or Backspace key with selected nodes
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedNodes.length > 0
      ) {
        e.preventDefault();
        onDelete();
      }

      // =====================================
      // CTRL/CMD COMBINATIONS
      // =====================================
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          // Duplicate: Ctrl/Cmd+D
          case "d":
            e.preventDefault();
            if (selectedNodes.length > 0) {
              onDuplicate();
            }
            break;

          // Copy: Ctrl/Cmd+C
          case "c":
            if (selectedNodes.length > 0) {
              e.preventDefault();
              onCopy();
            }
            break;

          // Paste: Ctrl/Cmd+V
          case "v":
            e.preventDefault();
            onPaste();
            break;

          // Select All: Ctrl/Cmd+A
          case "a":
            e.preventDefault();
            onSelectAll();
            break;
        }
      }

      // =====================================
      // ESCAPE KEY
      // =====================================
      // Deselect all nodes
      if (e.key === "Escape") {
        onDeselect();
      }
    };

    // Register global keyboard listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup listener on unmount or dependency change
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNodes,
    onDelete,
    onDuplicate,
    onCopy,
    onPaste,
    onSelectAll,
    onDeselect,
  ]);
}
