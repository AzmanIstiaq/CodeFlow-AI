import { useState, useEffect } from "react";
import type { Node, Edge } from "reactflow";

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
  updateNodes,
  closePanel,
  edges = [],
  nodes = [],
}: NodeSettingsPanelProps) {
  const [localData, setLocalData] = useState<any>({});
  const [columnWarning, setColumnWarning] = useState<ColumnWarning>({ show: false, message: "" });

  // Initialize local state when node changes
  useEffect(() => {
    if (node) {
      setLocalData(node.data || {});
    }
  }, [node]);

  if (!node) return null;

  // Find parent section for text nodes
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

      {/* Column information */}
      {node.data?._ownedByColumn && (
        <div className="panel-breadcrumb" style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px" }}>
          📍 Column: <strong>Column {(node.data._columnIndex ?? 0) + 1}</strong>
          {nodes.find((n) => n.id === node.data._ownedByColumn)?.data?.label && (
            <span> in <strong>{nodes.find((n) => n.id === node.data._ownedByColumn)?.data?.label}</strong></span>
          )}
        </div>
      )}

      {/* Breadcrumb for containment */}
      {parentSection && (
        <div className="panel-breadcrumb">
          📍 Inside: <strong>{parentSection.data?.label || "Section"}</strong>
        </div>
      )}

      {/* Generic label field - skip for nodes that have their own specific label field */}
      {node.type !== "button" && node.type !== "text" && (
        <div className="panel-section">
          <label>Label</label>
          <input
            className="input-field"
            type="text"
            value={localData.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Enter node label"
          />
        </div>
      )}

      {node.type === "ai" && (
        <>
          <div className="panel-section">
            <label>Prompt</label>
            <textarea
              className="textarea-field"
              value={localData.prompt || ""}
              onChange={(e) => handleChange("prompt", e.target.value)}
              placeholder="Enter AI prompt"
              rows={6}
            />
          </div>

          <div className="panel-section">
            <label>Temperature</label>
            <input
              className="number-field"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={localData.temperature ?? 0.7}
              onChange={(e) =>
                handleChange("temperature", parseFloat(e.target.value))
              }
            />
            <small>Range: 0 (deterministic) to 1 (creative)</small>
          </div>

          <div className="panel-section">
            <label>Model</label>
            <select
              className="input-field"
              value={localData.model || "llama3.2"}
              onChange={(e) => handleChange("model", e.target.value)}
            >
              <option value="llama3.2">Llama 3.2 (3B)</option>
              <option value="llama3.2:1b">Llama 3.2 (1B)</option>
              <option value="llama3.1">Llama 3.1 (8B)</option>
              <option value="phi3">Phi-3 (3.8B)</option>
              <option value="gemma2">Gemma 2 (9B)</option>
              <option value="qwen2.5">Qwen 2.5 (7B)</option>
              <option value="mistral">Mistral (7B)</option>
            </select>
            <small>Install models with: ollama pull &lt;model-name&gt;</small>
          </div>
        </>
      )}

      {node.type === "output" && (
        <div className="panel-section">
          <label>Output Variable Name</label>
          <input
            className="input-field"
            type="text"
            value={localData.outputName || ""}
            onChange={(e) => handleChange("outputName", e.target.value)}
            placeholder="e.g., result, response"
          />
        </div>
      )}

      {node.type === "text" && (
        <>
          <div className="panel-section">
            <label>Text Content</label>
            <textarea
              className="textarea-field"
              value={localData.text || ""}
              onChange={(e) => handleChange("text", e.target.value)}
              placeholder="Enter text content"
              rows={6}
            />
          </div>

          <div className="panel-section">
            <label>Font Size</label>
            <input
              className="number-field"
              type="number"
              min="8"
              max="48"
              value={localData.fontSize || 14}
              onChange={(e) =>
                handleChange("fontSize", parseInt(e.target.value))
              }
            />
            <small>Range: 8px to 48px</small>
          </div>

          <div className="panel-section">
            <label>Text Color</label>
            <input
              className="input-field"
              type="color"
              value={localData.color || "#000000"}
              onChange={(e) => handleChange("color", e.target.value)}
            />
          </div>
        </>
      )}

      {node.type === "section" && (
        <>
          <div className="panel-section">
            <label>Columns</label>
            <input
              type="range"
              min="1"
              max="6"
              value={localData.columns?.count ?? 1}
              onChange={(e) => {
                const newCount = Number(e.target.value);
                const currentCount = localData.columns?.count ?? 1;

                // Check if reducing columns
                if (newCount < currentCount) {
                  // Check if any nodes exist in columns that would be removed
                  const nodesInRemovedColumns = nodes.filter((n: any) => 
                    n.data?._ownedByColumn === node.id && 
                    n.data?._columnIndex >= newCount
                  );

                  if (nodesInRemovedColumns.length > 0) {
                    setColumnWarning({
                      show: true,
                      message: `Cannot reduce to ${newCount} column${newCount > 1 ? 's' : ''}. Please remove ${nodesInRemovedColumns.length} node${nodesInRemovedColumns.length > 1 ? 's' : ''} from column${currentCount > newCount + 1 ? 's' : ''} ${newCount + 1}${currentCount > newCount + 1 ? `-${currentCount}` : ''} first.`
                    });
                    return;
                  }
                }

                // Clear warning if valid change
                setColumnWarning({ show: false, message: "" });

                // Update section data first
                const newSectionData = {
                  ...node.data,
                  columns: {
                    ...(node.data.columns ?? {}),
                    count: newCount,
                  },
                };

                // Redistribute nodes across new column layout (both increasing and decreasing)
                if (updateNodes && newCount !== currentCount) {
                  updateNodes((allNodes: any[]) => {
                    // Find the section node to get its position
                    const sectionNode = allNodes.find((n: any) => n.id === node.id);
                    if (!sectionNode) return allNodes;

                    const frameWidth = 1280;
                    const newColumnWidth = frameWidth / newCount;
                    const sectionX = sectionNode.position?.x ?? 0;

                    return allNodes.map((n: any) => {
                      // Update the section node with new column count
                      if (n.id === node.id) {
                        return {
                          ...n,
                          data: newSectionData,
                        };
                      }

                      // Only update nodes in this section
                      if (n.data?._ownedByColumn !== node.id) return n;

                      // Keep node in its current column index (already validated above)
                      const columnIndex = n.data._columnIndex ?? 0;
                      
                      // Calculate new X position based on new column width
                      // Position = section X + (column width * column index) + left padding
                      const newX = sectionX + (newColumnWidth * columnIndex) + 32;

                      return {
                        ...n,
                        position: {
                          ...n.position,
                          x: newX,
                        },
                        data: {
                          ...n.data,
                          _columnIndex: columnIndex,
                        },
                      };
                    });
                  });
                } else {
                  // If not redistributing, still update section data
                  updateNodeData(node.id, newSectionData);
                }

                setLocalData((prev: any) => ({
                  ...prev,
                  columns: {
                    ...(prev.columns ?? {}),
                    count: newCount,
                  },
                }));
              }}
            />
            <small>{localData.columns?.count ?? 1} columns</small>
            {columnWarning.show && (
              <div style={{
                marginTop: "8px",
                padding: "8px 12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "4px",
                color: "#991b1b",
                fontSize: "12px"
              }}>
                ⚠️ {columnWarning.message}
              </div>
            )}
          </div>
          <div className="panel-section">
            <label>Alignment</label>
            <select
              className="input-field"
              value={localData.align || "start"}
              onChange={(e) => handleChange("align", e.target.value)}
            >
              <option value="start">Left</option>
              <option value="center">Center</option>
            </select>
          </div>

          <div className="panel-section">
            <label>Gap (spacing between children)</label>
            <input
              className="number-field"
              type="range"
              min="0"
              max="40"
              value={localData.gap || 16}
              onChange={(e) => handleChange("gap", parseInt(e.target.value))}
            />
            <small>{localData.gap || 16}px</small>
          </div>

          <div className="panel-section">
            <label>Max Width (content width)</label>
            <input
              className="number-field"
              type="range"
              min="600"
              max="1200"
              step="40"
              value={localData.maxWidth || 960}
              onChange={(e) =>
                handleChange("maxWidth", parseInt(e.target.value))
              }
            />
            <small>{localData.maxWidth || 960}px</small>
          </div>

          <div className="panel-section">
            <label>Padding</label>
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

          <div className="panel-section">
            <label>Background Color</label>
            <input
              className="input-field"
              type="color"
              value={localData.backgroundColor || "#000000"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
            />
          </div>
        </>
      )}

      {node.type === "button" && (
        <>
          <div className="panel-section">
            <label>Label</label>
            <input
              className="input-field"
              type="text"
              value={localData.label || ""}
              onChange={(e) => handleChange("label", e.target.value)}
              placeholder="Button text"
            />
          </div>

          <div className="panel-section">
            <label>Link (href)</label>
            <input
              className="input-field"
              type="text"
              value={localData.href || ""}
              onChange={(e) => handleChange("href", e.target.value)}
              placeholder="e.g., #, /page, https://..."
            />
          </div>

          <div className="panel-section">
            <label>Variant</label>
            <select
              className="input-field"
              value={localData.variant || "primary"}
              onChange={(e) => handleChange("variant", e.target.value)}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
        </>
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
