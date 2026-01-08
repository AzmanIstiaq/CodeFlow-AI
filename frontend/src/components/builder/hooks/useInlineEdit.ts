/**
 * useInlineEdit Hook
 *
 * Manages inline editing state for node labels and text properties.
 *
 * Features:
 * - Toggle edit mode on/off
 * - Auto-focus and select text on edit start
 * - Save changes on blur or Enter key
 * - Revert changes on Escape key
 * - Tracks value changes separately from initial value
 *
 * Usage Pattern:
 * 1. Initialize with current value and save callback
 * 2. Double-click node to call startEditing()
 * 3. User edits in focused input
 * 4. Enter/blur to save, Escape to revert
 *
 * The hook provides all ref, state, and handler functions needed for
 * controlled editing UI (text input or textarea for larger content)
 */

import { useState, useRef, useEffect, useCallback } from "react";

export function useInlineEdit(
  initialValue: string,
  onSave: (value: string) => void
) {
  // =====================================
  // EDIT STATE
  // =====================================
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // =====================================
  // VALUE SYNCHRONIZATION
  // =====================================
  /**
   * Update internal value when initialValue prop changes
   * This handles external updates to the node label/value
   */
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // =====================================
  // FOCUS MANAGEMENT
  // =====================================
  /**
   * Auto-focus and select all text when entering edit mode
   * Provides smooth UX: user sees text selected, ready to type
   */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Focus input and select all text for quick replacement
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // =====================================
  // EDIT MODE TOGGLES
  // =====================================
  /**
   * Enter edit mode
   * User typically calls this via double-click or edit button
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  /**
   * Exit edit mode and save if value changed
   * Compares new value against initial value
   * Only calls onSave if there was an actual change
   */
  const stopEditing = useCallback(() => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(value);
    }
  }, [value, initialValue, onSave]);

  // =====================================
  // EVENT HANDLERS
  // =====================================
  /**
   * Handle key press in input
   * - Enter (without Shift): Save and exit
   * - Escape: Revert to initial value and exit
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        // Save on Enter
        e.preventDefault();
        stopEditing();
      } else if (e.key === "Escape") {
        // Revert on Escape
        e.preventDefault();
        setValue(initialValue);
        setIsEditing(false);
      }
    },
    [initialValue, stopEditing]
  );

  /**
   * Handle blur (click outside input)
   * Save changes when user leaves the input field
   */
  const handleBlur = useCallback(() => {
    stopEditing();
  }, [stopEditing]);

  /**
   * Handle value changes during editing
   * Update internal value as user types
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    []
  );

  // =====================================
  // HOOK EXPORTS
  // =====================================
  // Return state and handlers for UI component to use
  return {
    isEditing,
    value,
    inputRef,
    startEditing,
    stopEditing,
    handleKeyDown,
    handleBlur,
    handleChange,
  };
}
