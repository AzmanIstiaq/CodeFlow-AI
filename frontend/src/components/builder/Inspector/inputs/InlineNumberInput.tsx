import { useState, useEffect } from "react";

interface InlineNumberInputProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
}

export default function InlineNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  unit = "",
  disabled = false,
}: InlineNumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    const increment = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newValue = Number(localValue) + increment;
      const clamped = max !== undefined ? Math.min(newValue, max) : newValue;
      onChange(clamped);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newValue = Number(localValue) - increment;
      const clamped = min !== undefined ? Math.max(newValue, min) : newValue;
      onChange(clamped);
    } else if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const handleBlur = () => {
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      let clamped = num;
      if (min !== undefined) clamped = Math.max(clamped, min);
      if (max !== undefined) clamped = Math.min(clamped, max);
      onChange(clamped);
      setLocalValue(String(clamped));
    } else {
      setLocalValue(String(value));
    }
  };

  return (
    <div className="inline-number-input">
      <label>{label}</label>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
      />
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}
