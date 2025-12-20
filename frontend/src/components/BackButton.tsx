import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  to?: string;
  label?: string;
}

export default function BackButton({
  to = "/",
  label = "Back",
}: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="back-button"
      title={`Back to ${to === "/" ? "Home" : "previous page"}`}
    >
      ← {label}
    </button>
  );
}
