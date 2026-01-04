interface IconButtonProps {
  icon: string;
  onClick: () => void;
  tooltip?: string;
  variant?: "default" | "danger";
  disabled?: boolean;
}

export default function IconButton({
  icon,
  onClick,
  tooltip,
  variant = "default",
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      className={`icon-button icon-button-${variant}`}
      onClick={onClick}
      title={tooltip}
      disabled={disabled}
      type="button"
    >
      {icon}
    </button>
  );
}
