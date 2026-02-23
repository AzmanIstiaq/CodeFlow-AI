/**
 * File: exportNextJsZip.templates.ts
 *
 * Purpose:
 * - Store static template payloads used by the Next.js ZIP export.
 *
 * Controls:
 * - Generated component source files and shared global CSS injected into exported pages.
 *
 * Directly related files:
 * - frontend/src/utils/exportNextJsZip.ts
 * - frontend/public/export-nextjs/app/page.tsx
 */

/**
 * Function Name: generateExportComponentFiles
 *
 * Purpose:
 * - Build an in-memory map of component file names to file contents for exported Next.js projects.
 *
 * How It Works:
 * - Defines lightweight primitive wrappers as string templates.
 * - Creates field component templates (input, textarea, checkbox, radio, select).
 * - Returns a `Record<string, string>` used by ZIP generation.
 *
 * Parameters:
 * - None.
 *
 * Returns:
 * - `Record<string, string>`: Component file names mapped to TypeScript/TSX source text.
 *
 * If You Want to Modify This Behavior:
 * - Go to: `frontend/src/utils/exportNextJsZip.ts`
 * - Change: The ZIP assembly loop that writes `/components/*` entries.
 */
export const generateExportComponentFiles = () => {
  // Exported components run in App Router client mode so generated hooks/events work.
  const clientDirective = `"use client";\n\n`;
  const simple = (name: string, tag: string) =>
    `${clientDirective}type PrimitiveProps = {
  className?: string;
  style?: Record<string, any>;
  children?: any;
  [key: string]: any;
};

export function ${name}({ children, ...props }: PrimitiveProps) {
  return <${tag} {...props}>{children}</${tag}>;
}
`;

  return {
    "CanvasSection.tsx": simple("CanvasSection", "section"),
    "CanvasRow.tsx": simple("CanvasRow", "div"),
    "CanvasColumns.tsx": simple("CanvasColumns", "div"),
    "CanvasColumn.tsx": simple("CanvasColumn", "div"),
    "CanvasHeader.tsx": simple("CanvasHeader", "header"),
    "CanvasFooter.tsx": simple("CanvasFooter", "footer"),
    "CanvasButton.tsx": `${clientDirective}type PrimitiveProps = {
  className?: string;
  style?: Record<string, any>;
  children?: any;
  [key: string]: any;
};

export function CanvasButton({ children, type, href, ...props }: PrimitiveProps) {
  if (typeof href === "string" && href.trim()) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} {...props}>
      {children}
    </button>
  );
}
`,
    "CanvasFormInput.tsx": `${clientDirective}type FormInputProps = {
  className?: string;
  style?: Record<string, any>;
  label?: string;
  placeholder?: string;
  inputType?: string;
  required?: boolean;
  // Controlled value/onChange are injected by behavior-aware export codegen.
  value?: string;
  onChange?: (value: string) => void;
};

export function CanvasFormInput({
  className,
  style,
  label,
  placeholder,
  inputType,
  required,
  value,
  onChange,
}: FormInputProps) {
  return (
    <div className={className} style={style}>
      {label ? (
        <label style={{ display: "block", marginBottom: 6 }}>
          {label}
          {required ? <span style={{ color: "#ef4444" }}> *</span> : null}
        </label>
      ) : null}
      <input
        type={inputType ?? "text"}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder ?? "Enter text..."}
        style={{ width: "100%" }}
      />
    </div>
  );
}
`,
    "CanvasFormTextarea.tsx": `${clientDirective}type FormTextareaProps = {
  className?: string;
  style?: Record<string, any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  // Controlled value/onChange are injected by behavior-aware export codegen.
  value?: string;
  onChange?: (value: string) => void;
};

export function CanvasFormTextarea({
  className,
  style,
  label,
  placeholder,
  required,
  rows,
  value,
  onChange,
}: FormTextareaProps) {
  return (
    <div className={className} style={style}>
      {label ? (
        <label style={{ display: "block", marginBottom: 6 }}>
          {label}
          {required ? <span style={{ color: "#ef4444" }}> *</span> : null}
        </label>
      ) : null}
      <textarea
        rows={rows ?? 4}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder ?? "Enter your message..."}
        style={{ width: "100%" }}
      />
    </div>
  );
}
`,
    "CanvasFormCheckbox.tsx": `${clientDirective}type FormCheckboxProps = {
  className?: string;
  style?: Record<string, any>;
  label?: string;
  checked?: boolean;
  required?: boolean;
  // Controlled checked/onChange are injected by behavior-aware export codegen.
  onChange?: (checked: boolean) => void;
};

export function CanvasFormCheckbox({
  className,
  style,
  label,
  checked,
  required,
  onChange,
}: FormCheckboxProps) {
  return (
    <label className={className} style={{ ...style, display: "inline-flex", alignItems: "center", gap: 8 }}>
      <input
        type="checkbox"
        checked={checked === true}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span>
        {label ?? "Checkbox"}
        {required ? <span style={{ color: "#ef4444" }}> *</span> : null}
      </span>
    </label>
  );
}
`,
    "CanvasFormRadio.tsx": `${clientDirective}type FormRadioProps = {
  className?: string;
  style?: Record<string, any>;
  label?: string;
  options?: string[];
  selectedValue?: string;
  required?: boolean;
  groupName?: string;
  layout?: "vertical" | "horizontal";
  // Controlled selectedValue/onChange are injected by behavior-aware export codegen.
  onChange?: (value: string) => void;
};

export function CanvasFormRadio({
  className,
  style,
  label,
  options,
  selectedValue,
  required,
  groupName,
  layout,
  onChange,
}: FormRadioProps) {
  const resolvedOptions =
    Array.isArray(options) && options.length
      ? options
      : ["Option 1", "Option 2", "Option 3"];
  const direction = layout === "horizontal" ? "row" : "column";
  return (
    <fieldset className={className} style={style}>
      {label ? (
        <legend>
          {label}
          {required ? <span style={{ color: "#ef4444" }}> *</span> : null}
        </legend>
      ) : null}
      <div style={{ display: "flex", flexDirection: direction, gap: 8 }}>
        {resolvedOptions.map((option, index) => (
          <label key={index} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name={groupName ?? "radio-group"}
              value={option}
              checked={selectedValue === option}
              onChange={() => onChange?.(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
`,
    "CanvasFormSelect.tsx": `${clientDirective}type FormSelectProps = {
  className?: string;
  style?: Record<string, any>;
  label?: string;
  placeholder?: string;
  options?: string[];
  selectedValue?: string;
  required?: boolean;
  // Controlled selectedValue/onChange are injected by behavior-aware export codegen.
  onChange?: (value: string) => void;
};

export function CanvasFormSelect({
  className,
  style,
  label,
  placeholder,
  options,
  selectedValue,
  required,
  onChange,
}: FormSelectProps) {
  const resolvedOptions =
    Array.isArray(options) && options.length
      ? options
      : ["Option 1", "Option 2", "Option 3"];
  const emptyOption = placeholder ?? "Select an option...";
  return (
    <div className={className} style={style}>
      {label ? (
        <label style={{ display: "block", marginBottom: 6 }}>
          {label}
          {required ? <span style={{ color: "#ef4444" }}> *</span> : null}
        </label>
      ) : null}
      <select
        value={selectedValue || ""}
        onChange={(event) => onChange?.(event.target.value)}
        style={{ width: "100%" }}
      >
        <option value="">{emptyOption}</option>
        {resolvedOptions.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
`,
  } as Record<string, string>;
};

export const GLOBAL_EXPORT_CSS = `
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif; }
main { min-height: 100vh; width: 100%; }
`;
