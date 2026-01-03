import { useState, useEffect } from "react";
import type { Node, Edge } from "reactflow";
import { 
  TextNodeEditor, 
  ButtonNodeEditor,
  FormSelectNodeEditor,
  FormRadioNodeEditor,
  FormCheckboxNodeEditor,
  FormTextareaNodeEditor,
  FormInputNodeEditor,
  ContainerNodeEditor,
  ImageNodeEditor,
  ShapeNodeEditor
} from "./editors";

interface ColumnWarning {
  show: boolean;
  message: string;
}

interface NodeSettingsPanelProps {
  node: Node<any> | null;
  updateNodeData: (id: string, data: any) => void;
  updateNodes?: (updater: (nodes: any[]) => any[]) => void;
  closePanel: () => void;
  edges?: Edge[];
  nodes?: Node[];
}

export default function NodeSettingsPanel({
  node,
  updateNodeData,
  closePanel,
  edges = [],
  nodes = [],
}: NodeSettingsPanelProps) {
  const [localData, setLocalData] = useState<any>({});
  const [columnWarning] = useState<ColumnWarning>({ show: false, message: "" });
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  useEffect(() => {
    if (node) {
      setLocalData(node.data || {});
    }
  }, [node]);

  if (!node) return null;

  const parentEdge = edges.find((e) => e.target === node.id);
  const parentSection = parentEdge
    ? nodes.find((n) => n.id === parentEdge.source)
    : null;

  const handleSave = () => {
    updateNodeData(node.id, localData);
  };

  const handleChange = (field: string, value: any) => {
    setLocalData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="node-editor-panel">
      <div className="panel-header">
        <h3>Node Settings</h3>
        <button className="panel-close-button" onClick={closePanel}>
          ×
        </button>
      </div>

      {node.data?._ownedByColumn && (
        <div className="panel-breadcrumb" style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px" }}>
          📍 Column: <strong>Column {(node.data._columnIndex ?? 0) + 1}</strong>
          {nodes.find((n) => n.id === node.data._ownedByColumn)?.data?.label && (
            <span> in <strong>{nodes.find((n) => n.id === node.data._ownedByColumn)?.data?.label}</strong></span>
          )}
        </div>
      )}

      {columnWarning.show && (
        <div className="panel-warning" style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px" }}>
          ⚠️ {columnWarning.message}
        </div>
      )}

      {node.type === "text" && (
        <TextNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "section" && (
        <>
          <div className="panel-section">
            <label>Columns</label>
            <input
              type="range"
              min="1"
              max="6"
              value={typeof localData.columns === 'object' ? (localData.columns?.count || 1) : (localData.columns || 1)}
              onChange={(e) => {
                const newCount = parseInt(e.target.value);
                handleChange("columns", typeof localData.columns === 'object' 
                  ? { ...localData.columns, count: newCount }
                  : { count: newCount, gap: 24 }
                );
              }}
              className="range-slider"
            />
            <div className="range-value">{typeof localData.columns === 'object' ? (localData.columns?.count || 1) : (localData.columns || 1)} column(s)</div>
          </div>

          <div className="panel-field">
            <label>Section Label</label>
            <input
              className="input-field"
              type="text"
              value={localData.label || ""}
              onChange={(e) => handleChange("label", e.target.value)}
              placeholder="Section name"
            />
          </div>

          <div className="panel-field">
            <label>Max Width (px)</label>
            <input
              className="number-field"
              type="number"
              min="400"
              max="1400"
              value={localData.maxWidth || 1200}
              onChange={(e) => handleChange("maxWidth", parseInt(e.target.value))}
            />
            <small>Range: 400px to 1400px</small>
          </div>

          <div className="panel-field">
            <label>Padding (px)</label>
            <input
              className="number-field"
              type="number"
              min="0"
              max="100"
              value={localData.padding || 40}
              onChange={(e) =>
                handleChange("padding", parseInt(e.target.value))
              }
            />
            <small>Range: 0px to 100px</small>
          </div>

          <div className="panel-field">
            <label>Background Color</label>
            <input
              type="color"
              value={localData.backgroundColor || "#000000"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
            />
          </div>
        </>
      )}

      {node.type === "button" && (
        <ButtonNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "formSelect" && (
        <FormSelectNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "formRadio" && (
        <FormRadioNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "formCheckbox" && (
        <FormCheckboxNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "formTextarea" && (
        <FormTextareaNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "formInput" && (
        <FormInputNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "container" && (
        <ContainerNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "image" && (
        <ImageNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {node.type === "shape" && (
        <ShapeNodeEditor 
          localData={localData}
          handleChange={handleChange}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
        />
      )}

      {parentSection && (
        <div className="panel-info" style={{ backgroundColor: "#f0f9ff", color: "#075985", padding: "8px 12px", borderRadius: "6px", marginTop: "12px" }}>
          ℹ️ This node is inside <strong>{parentSection.data?.label || "a section"}</strong>
        </div>
      )}

      <div className="panel-section panel-section-footer">
        <button className="panel-save-button" onClick={handleSave}>
          ✓ Save Changes
        </button>
        <button className="panel-cancel-button" onClick={closePanel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
