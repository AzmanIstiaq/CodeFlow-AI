import { useState, useEffect } from "react";
import type { Node } from "reactflow";

interface NodeSettingsPanelProps {
  node: Node<any> | null;
  updateNodeData: (id: string, data: any) => void;
  closePanel: () => void;
}

export default function NodeSettingsPanel({
  node,
  updateNodeData,
  closePanel,
}: NodeSettingsPanelProps) {
  const [localData, setLocalData] = useState<any>({});

  // Initialize local state when node changes
  useEffect(() => {
    if (node) {
      setLocalData(node.data || {});
    }
  }, [node]);

  if (!node) return null;

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
