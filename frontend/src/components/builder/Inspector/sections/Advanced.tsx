/**
 * Advanced Section
 *
 * Purpose:
 * - Provide diagnostics and destructive actions for selected nodes.
 *
 * Role in the system:
 * - Houses reset and delete controls plus metadata display.
 *
 * Key responsibilities:
 * - Show node identifiers and parent context when available.
 * - Reset common style fields to defaults.
 * - Delete nodes with confirmation while respecting protected types.
 *
 * Important constraints and assumptions:
 * - Section nodes are protected from deletion.
 * - Multi-selection delete is blocked if any section is included.
 */

import { useState } from "react";
import type { SectionProps } from "../types";
import { IconButton } from "../inputs";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

// ================================
// Types
// ================================
interface AdvancedProps extends SectionProps {
  deleteNode: (id: string) => void;
  deleteNodes: (ids: string[]) => void;
}

// ================================
// Component
// ================================
/**
 * Advanced actions and metadata for the current selection.
 */
export default function Advanced({
  selectedNodes,
  updateNode,
  deleteNode,
  deleteNodes,
  allNodes,
}: AdvancedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMultiSelect = selectedNodes.length > 1;
  const node = selectedNodes[0];

  if (!node) return null;

  // ================================
  // Handlers
  // ================================
  /**
   * Confirm and delete nodes based on selection scope.
   */
  const handleDelete = () => {
    if (isMultiSelect) {
      if (selectedNodes.some((n) => n.type === "section")) return;
      if (confirm(`Delete ${selectedNodes.length} layers?`)) {
        deleteNodes(selectedNodes.map((n) => n.id));
      }
    } else {
      if (node.type === "section") return;
      if (confirm(`Delete ${node.data?.label || node.id}?`)) {
        deleteNode(node.id);
      }
    }
  };

  /**
   * Reset visual styles to their default values.
   */
  const handleResetStyles = () => {
    if (isMultiSelect) {
      selectedNodes.forEach((n) => {
        updateNode(n.id, {
          backgroundColor: "#ffffff",
          borderColor: "#000000",
          borderWidth: 0,
          borderRadius: 0,
          opacity: 100,
        });
      });
    } else {
      updateNode(node.id, {
        backgroundColor: "#ffffff",
        borderColor: "#000000",
        borderWidth: 0,
        borderRadius: 0,
        opacity: 100,
      });
    }
  };

  const parentNode = allNodes?.find((n) => n.id === node.data?._ownedByColumn);

  const isDeleteBlocked = isMultiSelect
    ? selectedNodes.some((n) => n.type === "section")
    : node.type === "section";

  // ================================
  // Render
  // ================================
  return (
    <div
      className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}
    >
      <div
        className="inspector-section-title"
        onClick={() => setIsOpen(!isOpen)}
      >
        Advanced
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
          {!isMultiSelect && (
            <>
              <div className="inspector-field">
                <label>Node ID</label>
                <div className="inspector-readonly">{node.id}</div>
              </div>

              {parentNode && (
                <div className="inspector-field">
                  <label>Parent Container</label>
                  <div className="inspector-readonly">
                    {parentNode.data?.label || parentNode.id}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="inspector-actions">
            <button className="inspector-button" onClick={handleResetStyles}>
              Reset Styles
            </button>

            {!isDeleteBlocked && (
              <IconButton
                icon={<Trash2 size={16} aria-hidden="true" />}
                onClick={handleDelete}
                variant="danger"
                tooltip={
                  isMultiSelect ? "Delete selected layers" : "Delete layer"
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
