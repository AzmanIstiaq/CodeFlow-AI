import { useState, useEffect } from "react";
import type { Node } from "reactflow";
import { ToggleIcon, TextInput } from "./inputs";

interface SelectionHeaderProps {
  selectedNodes: Node[];
  updateNode: (id: string, updates: any) => void;
  updateNodes: (ids: string[], updates: any) => void;
  onClose: () => void;
}

export default function SelectionHeader({
  selectedNodes,
  updateNode,
  updateNodes,
  onClose,
}: SelectionHeaderProps) {
  const [nodeName, setNodeName] = useState("");
  const isMultiSelect = selectedNodes.length > 1;
  const node = selectedNodes[0];

  useEffect(() => {
    if (node && !isMultiSelect) {
      setNodeName(node.data?.label || node.data?.text || node.id);
    }
  }, [node, isMultiSelect]);

  const handleNameChange = (value: string) => {
    setNodeName(value);
    if (node) {
      updateNode(node.id, { label: value });
    }
  };

  const toggleVisibility = () => {
    if (isMultiSelect) {
      const allHidden = selectedNodes.every(n => n.data?.hidden);
      updateNodes(
        selectedNodes.map(n => n.id),
        { hidden: !allHidden }
      );
    } else if (node) {
      updateNode(node.id, { hidden: !node.data?.hidden });
    }
  };

  const toggleLock = () => {
    if (isMultiSelect) {
      const allLocked = selectedNodes.every(n => n.data?.locked);
      updateNodes(
        selectedNodes.map(n => n.id),
        { locked: !allLocked }
      );
    } else if (node) {
      updateNode(node.id, { locked: !node.data?.locked });
    }
  };

  const getNodeTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      section: "Frame",
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
        <button className="inspector-close" onClick={onClose}>
          ×
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
          icon="👁"
          active={isMultiSelect 
            ? !selectedNodes.every(n => n.data?.hidden)
            : !node?.data?.hidden
          }
          onClick={toggleVisibility}
          tooltip="Toggle visibility"
        />
        <ToggleIcon
          icon="🔒"
          active={isMultiSelect
            ? selectedNodes.every(n => n.data?.locked)
            : node?.data?.locked || false
          }
          onClick={toggleLock}
          tooltip="Toggle lock"
        />
      </div>
    </div>
  );
}
