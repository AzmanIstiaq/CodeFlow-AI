/**
 * AI Node
 *
 * Purpose:
 * - Render an AI processing node with prompt, model, and status preview.
 *
 * Role in the system:
 * - Represents an execution step in workflow mode.
 *
 * Key responsibilities:
 * - Display status feedback during execution.
 * - Preview prompt, model, and output snippets.
 * - Provide input and output handles for graph connections.
 *
 * Important constraints and assumptions:
 * - Status display depends on data.status and data.output values.
 */

import { Handle, Position } from "reactflow";
import { Bot, CheckCircle, Loader2, XCircle } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Workflow AI node with status and preview fields.
 */
export default function AINode({ data }: any) {
  // ================================
  // Status Rendering
  // ================================
  /**
   * Render status chips based on execution state.
   */
  const getStatusDisplay = () => {
    if (data.status === "executing") {
      return (
        <div className="field-preview status-executing">
          <Loader2 size={14} aria-hidden="true" /> Executing...
        </div>
      );
    }
    if (data.status === "failed") {
      return (
        <div className="field-preview status-failed">
          <XCircle size={14} aria-hidden="true" /> Failed
        </div>
      );
    }
    if (data.status === "completed" && data.output) {
      return (
        <div className="field-preview status-completed">
          <CheckCircle size={14} aria-hidden="true" /> Completed
        </div>
      );
    }
    return null;
  };

  return (
    <div className="react-flow__node-default node-ai">
      <div className="title">
        <Bot size={16} aria-hidden="true" /> {data.label}
      </div>

      <div className="node-content">
        {getStatusDisplay()}

        {data.prompt && (
          <div className="field-preview">
            <strong>Prompt:</strong> {data.prompt.substring(0, 50)}
            {data.prompt.length > 50 ? "..." : ""}
          </div>
        )}
        {data.model && (
          <div className="field-preview">
            <strong>Model:</strong> {data.model}
          </div>
        )}
        {data.output && (
          <div className="field-preview output">
            <strong>Output:</strong> {data.output.substring(0, 100)}
            {data.output.length > 100 ? "..." : ""}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
