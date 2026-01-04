import { useState, useEffect } from "react";

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function ColorInput({
  value,
  onChange,
  label,
  disabled = false,
}: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (/^#[0-9A-F]{6}$/i.test(localValue)) {
      onChange(localValue);
    } else {
      setLocalValue(value);
    }
  };

  return (
    <div className="color-input">
      {label && <label>{label}</label>}
      <div className="color-input-row">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="color-swatch"
        />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
          onBlur={handleBlur}
          disabled={disabled}
          className="color-hex"
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  );
}
