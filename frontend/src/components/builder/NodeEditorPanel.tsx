import { useState, useEffect } from "react";
import type { Node } from "reactflow";

interface NodeSettingsPanelProps {
    node: Node<any> | null;
    updateNodeData: (id: string, data: any) => void;
    closePanel: () => void;
}

export default function NodeSettingsPanel({ node, updateNodeData, closePanel }: NodeSettingsPanelProps) {
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
        <button className="panel-close-button" onClick={closePanel}>×</button>
      </div>

      <div className="panel-section">
        <label>Label</label>
        <input
          className="input-field"
          type="text"
          value={localData.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Enter node label"
        />
      </div>

      {node.type === 'ai' && (
        <>
          <div className="panel-section">
            <label>Prompt</label>
            <textarea
              className="textarea-field"
              value={localData.prompt || ''}
              onChange={(e) => handleChange('prompt', e.target.value)}
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
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            />
            <small style={{ color: '#999', display: 'block', marginTop: '4px' }}>
              Range: 0 (deterministic) to 1 (creative)
            </small>
          </div>

          <div className="panel-section">
            <label>Model</label>
            <input
              className="input-field"
              type="text"
              value={localData.model || 'gpt-4'}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="e.g., gpt-4, gpt-3.5-turbo"
            />
          </div>
        </>
      )}

      {node.type === 'output' && (
        <div className="panel-section">
          <label>Output Variable Name</label>
          <input
            className="input-field"
            type="text"
            value={localData.outputName || ''}
            onChange={(e) => handleChange('outputName', e.target.value)}
            placeholder="e.g., result, response"
          />
        </div>
      )}

      <div className="panel-section" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #333' }}>
        <button
          className="panel-save-button"
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          ✓ Save Changes
        </button>
        <button
          className="panel-cancel-button"
          onClick={closePanel}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
