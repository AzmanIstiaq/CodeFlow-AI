interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: TextInputProps) {
  return (
    <div className="text-input">
      {label && <label>{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
