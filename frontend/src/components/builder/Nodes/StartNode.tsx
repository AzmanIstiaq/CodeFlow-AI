/**
 * Start Node
 *
 * Purpose:
 * - Render the entry node for workflow graphs.
 *
 * Role in the system:
 * - Serves as the starting point for execution flows.
 *
 * Key responsibilities:
 * - Display the node label and provide a source handle.
 *
 * Important constraints and assumptions:
 * - Uses a single source handle on the right for outgoing connections.
 */

import { Handle, Position } from "reactflow";
import { Play } from "lucide-react";

// ================================
// Component
// ================================
/**
 * Workflow start node with a single outbound connection.
 */
export default function StartNode({ data }: any) {
  return (
    <div className="react-flow__node-default node-start">
      <span>
        <Play size={14} aria-hidden="true" /> {data.label}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
