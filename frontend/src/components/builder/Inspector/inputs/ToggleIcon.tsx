interface ToggleIconProps {
  icon: string;
  active: boolean;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
}

export default function ToggleIcon({
  icon,
  active,
  onClick,
  tooltip,
  disabled = false,
}: ToggleIconProps) {
  return (
    <button
      className={`toggle-icon ${active ? "active" : ""}`}
      onClick={onClick}
      title={tooltip}
      disabled={disabled}
      type="button"
    >
      {icon}
    </button>
  );
}
