/**
 * File: ColumnButtons.tsx
 *
 * Purpose:
 * - Render a reusable column-count button group for inspector controls.
 *
 * Controls:
 * - Available column count choices displayed to the user.
 *
 * Directly related files:
 * - frontend/src/components/builder/Inspector/sections/ColumnControl.tsx
 * - frontend/src/frontendRules/inspector/inspectorPolicy.ts
 */

type ColumnButtonsProps = {
  value: number;
  onChange: (count: number) => void;
  options?: number[];
  label?: string;
};

const DEFAULT_OPTIONS = [1, 2, 3, 4, 6];

/**
 * Reusable column count selector rendered as a single-line pill button group.
 */
export default function ColumnButtons({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  label,
}: ColumnButtonsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
          {label}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "nowrap",
          overflowX: "auto",
        }}
      >
        {options.map((count) => (
          <button
            key={count}
            className="inspector-button"
            onClick={() => onChange(count)}
            style={{
              minWidth: 42,
              background: value === count ? "#eff6ff" : "#ffffff",
              borderColor: value === count ? "#3b82f6" : "#e5e7eb",
              color: value === count ? "#3b82f6" : "#374151",
              padding: "6px 10px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
}
