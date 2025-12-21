import { Handle, Position } from "reactflow";

export default function AINode({ data }: any) {
  const getStatusDisplay = () => {
    if (data.status === "executing") {
      return (
        <div className="field-preview status-executing">⏳ Executing...</div>
      );
    }
    if (data.status === "failed") {
      return <div className="field-preview status-failed">❌ Failed</div>;
    }
    if (data.status === "completed" && data.output) {
      return <div className="field-preview status-completed">✅ Completed</div>;
    }
    return null;
  };

  return (
    <div className="react-flow__node-default node-ai">
      <div className="title">🤖 {data.label}</div>

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
