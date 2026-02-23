/**
 * Image Section
 *
 * Purpose:
 * - Configure source and presentation for image-like nodes.
 *
 * Role in the system:
 * - Provides URL/file upload controls for image nodes.
 *
 * Key responsibilities:
 * - Update image source URL and alt text.
 * - Allow local file upload by converting selected files to data URLs.
 * - Expose object-fit controls for rendered image behavior.
 */

import { useState } from "react";
import type { ChangeEvent } from "react";
import type { SectionProps } from "../types";
import { TextInput, SelectInput } from "../inputs";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Image-specific controls for a single selected node.
 */
export default function Image({
  selectedNodes,
  updateNode,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const node = selectedNodes[0];

  if (!node || node.type !== "image") return null;

  const handleChange = (field: string, value: any) => {
    updateNode(node.id, { [field]: value });
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result) {
        updateNode(node.id, { src: result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const src = String(node.data?.src ?? "");
  const alt = String(node.data?.alt ?? "");
  const objectFit = String(node.data?.objectFit ?? "cover");

  return (
    <div
      className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}
    >
      <div
        className="inspector-section-title"
        onClick={() => setIsOpen(!isOpen)}
      >
        Image
        <span className="inspector-section-toggle">
          {isOpen ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
        </span>
      </div>

      {isOpen && (
        <div className="inspector-section-content">
          <TextInput
            label="Image URL"
            value={src}
            onChange={(value) => handleChange("src", value)}
            placeholder="https://example.com/image.jpg"
          />

          <div className="inspector-field">
            <label>Upload image</label>
            <input type="file" accept="image/*" onChange={handleFileUpload} />
          </div>

          <TextInput
            label="Alt text"
            value={alt}
            onChange={(value) => handleChange("alt", value)}
            placeholder="Describe the image"
          />

          <SelectInput
            label="Object Fit"
            value={objectFit}
            options={[
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
              { value: "fill", label: "Fill" },
              { value: "none", label: "None" },
            ]}
            onChange={(value) => handleChange("objectFit", value)}
          />
        </div>
      )}
    </div>
  );
}
