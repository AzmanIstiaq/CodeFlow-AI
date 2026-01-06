import { useState } from "react";
import type { SectionProps } from "../types";
import { IconButton } from "../inputs";

interface AdvancedProps extends SectionProps {
  deleteNode: (id: string) => void;
  deleteNodes: (ids: string[]) => void;
}

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

  const handleDelete = () => {
    if (isMultiSelect) {
      if (selectedNodes.some(n => n.type === "section")) return;
      if (confirm(`Delete ${selectedNodes.length} layers?`)) {
        deleteNodes(selectedNodes.map(n => n.id));
      }
    } else {
      if (node.type === "section") return;
      if (confirm(`Delete ${node.data?.label || node.id}?`)) {
        deleteNode(node.id);
      }
    }
  };

  const handleResetStyles = () => {
    if (isMultiSelect) {
      selectedNodes.forEach(n => {
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

  const parentNode = allNodes?.find(n =>
    n.id === node.data?._ownedByColumn
  );

  const isDeleteBlocked = isMultiSelect
    ? selectedNodes.some(n => n.type === "section")
    : node.type === "section";

  return (
    <div className={`inspector-section ${isOpen ? "inspector-section-open" : ""}`}>
      <div
        className="inspector-section-title"
        onClick={() => setIsOpen(!isOpen)}
      >
        Advanced
        <span className="inspector-section-toggle">{isOpen ? "ƒ-¬" : "ƒ-"}</span>
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
            <button
              className="inspector-button"
              onClick={handleResetStyles}
            >
              Reset Styles
            </button>

            {!isDeleteBlocked && (
              <IconButton
                icon="dY-`"
                onClick={handleDelete}
                variant="danger"
                tooltip={isMultiSelect ? "Delete selected layers" : "Delete layer"}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
