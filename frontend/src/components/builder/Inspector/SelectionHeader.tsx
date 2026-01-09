/**
 * Selection Header
 *
 * Purpose:
 * - Display selection context and quick actions in the inspector.
 *
 * Role in the system:
 * - Provides naming, visibility, and lock controls for selected nodes.
 *
 * Key responsibilities:
 * - Reflect single vs multi-selection state in the header.
 * - Update node labels for single selections.
 * - Toggle visibility/lock across one or many nodes.
 *
 * Important constraints and assumptions:
 * - Multi-selection disables name editing to avoid conflicting labels.
 * - Row labels are derived from sibling ordering within a section.
 */

import { useState, useEffect } from "react";
import type { Node } from "reactflow";
import { ToggleIcon, TextInput } from "./inputs";
import { Eye, EyeOff, Lock, Unlock, X } from "lucide-react";

// ================================
// Types
// ================================
interface SelectionHeaderProps {
  selectedNodes: Node[];
  updateNode: (id: string, updates: any) => void;
  updateNodes: (ids: string[], updates: any) => void;
  onClose: () => void;
  allNodes?: Node[];
}

// ================================
// Component
// ================================
/**
 * Inspector header for selection metadata and quick actions.
 */
export default function SelectionHeader({
  selectedNodes,
  updateNode,
  updateNodes,
  onClose,
  allNodes,
}: SelectionHeaderProps) {
  const [nodeName, setNodeName] = useState("");
  const isMultiSelect = selectedNodes.length > 1;
  const node = selectedNodes[0];

  // ================================
  // Effects
  // ================================
  useEffect(() => {
    if (node && !isMultiSelect) {
      setNodeName(node.data?.label || node.data?.text || node.id);
    }
  }, [node, isMultiSelect]);

  // ================================
  // Handlers
  // ================================
  /**
   * Update the node's label for single selection.
   */
  const handleNameChange = (value: string) => {
    setNodeName(value);
    if (node) {
      updateNode(node.id, { label: value });
    }
  };

  /**
   * Toggle visibility for one or many nodes based on selection.
   */
  const toggleVisibility = () => {
    if (isMultiSelect) {
      const allHidden = selectedNodes.every((n) => n.data?.hidden);
      updateNodes(
        selectedNodes.map((n) => n.id),
        { hidden: !allHidden }
      );
    } else if (node) {
      updateNode(node.id, { hidden: !node.data?.hidden });
    }
  };

  /**
   * Toggle lock state for one or many nodes based on selection.
   */
  const toggleLock = () => {
    if (isMultiSelect) {
      const allLocked = selectedNodes.every((n) => n.data?.locked);
      updateNodes(
        selectedNodes.map((n) => n.id),
        { locked: !allLocked }
      );
    } else if (node) {
      updateNode(node.id, { locked: !node.data?.locked });
    }
  };

  // ================================
  // Label Helpers
  // ================================
  /**
   * Provide a stable label for row nodes based on sibling order.
   */
  const getRowLabel = () => {
    if (!node || node.type !== "row" || !allNodes) return "Row";
    const parentId = (node as any).parentNode;
    const rows = allNodes
      .filter((n) => n.type === "row" && (n as any).parentNode === parentId)
      .sort((a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0));
    const index = rows.findIndex((r) => r.id === node.id);
    return index >= 0 ? `Row ${index + 1}` : "Row";
  };

  /**
   * Map node types to human-readable names for the header.
   */
  const getNodeTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      section: "Frame",
      row: getRowLabel(),
      text: "Text",
      button: "Button",
      image: "Image",
      container: "Container",
      shape: "Shape",
      formInput: "Input",
      formTextarea: "Textarea",
      formCheckbox: "Checkbox",
      formRadio: "Radio",
      formSelect: "Select",
    };
    return typeMap[type] || type;
  };

  const isHidden = isMultiSelect
    ? selectedNodes.every((n) => n.data?.hidden)
    : !!node?.data?.hidden;
  const isLocked = isMultiSelect
    ? selectedNodes.every((n) => n.data?.locked)
    : !!node?.data?.locked;

  // ================================
  // Render
  // ================================
  return (
    <div className="inspector-header">
      <div className="inspector-header-top">
        <div className="inspector-title">
          {isMultiSelect ? (
            <span>Multiple layers selected ({selectedNodes.length})</span>
          ) : (
            <span>{getNodeTypeName(node?.type || "")}</span>
          )}
        </div>
        <button className="inspector-close" onClick={onClose} aria-label="Close">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {!isMultiSelect && (
        <TextInput
          value={nodeName}
          onChange={handleNameChange}
          placeholder="Layer name"
        />
      )}

      <div className="inspector-header-actions">
        <ToggleIcon
          icon={
            isHidden ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )
          }
          active={
            isMultiSelect
              ? !selectedNodes.every((n) => n.data?.hidden)
              : !node?.data?.hidden
          }
          onClick={toggleVisibility}
          tooltip="Toggle visibility"
        />
        <ToggleIcon
          icon={
            isLocked ? (
              <Lock size={16} aria-hidden="true" />
            ) : (
              <Unlock size={16} aria-hidden="true" />
            )
          }
          active={
            isMultiSelect
              ? selectedNodes.every((n) => n.data?.locked)
              : node?.data?.locked || false
          }
          onClick={toggleLock}
          tooltip="Toggle lock"
        />
      </div>
    </div>
  );
}
