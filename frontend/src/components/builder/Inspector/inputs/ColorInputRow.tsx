import ColorInput from "./ColorInput";

interface ColorInputRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ColorInputRow({
  label,
  value,
  onChange,
  disabled = false,
}: ColorInputRowProps) {
  return (
    <div className="inspector-row">
      <label>{label}</label>
      <ColorInput value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}
