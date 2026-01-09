/**
 * Output Node
 *
 * Purpose:
 * - Render the terminal node for workflow output.
 *
 * Role in the system:
 * - Displays final execution results from upstream nodes.
 *
 * Key responsibilities:
 * - Show the node label and optional result content.
 * - Provide a single target handle for inbound connections.
 *
 * Important constraints and assumptions:
 * - Result content is displayed only when data.result is present.
 */

import { Handle, Position } from "reactflow";
import { Terminal } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Workflow output node with a single inbound connection.
 */
export default function OutputNode({ data }: any) {
  return (
    <div className="react-flow__node-default node-output">
      <div className="title">
        <Terminal size={16} aria-hidden="true" /> {data.label}
      </div>

      {data.result && (
        <div className="node-content">
          <div className="field-preview output">
            <strong>Result:</strong> {data.result}
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} />
    </div>
  );
}
