import { useState, useRef, useEffect, useCallback } from "react";

export function useInlineEdit(initialValue: string, onSave: (value: string) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update value when initialValue changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(value);
    }
  }, [value, initialValue, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      stopEditing();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setValue(initialValue);
      setIsEditing(false);
    }
  }, [initialValue, stopEditing]);

  const handleBlur = useCallback(() => {
    stopEditing();
  }, [stopEditing]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
  }, []);

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
