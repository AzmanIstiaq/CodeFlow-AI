import { Handle, Position } from "reactflow";

export default function AINode({ data }: any) {
  return (
    <div className="react-flow__node-default node-ai">
  <div className="title">🤖 {data.label}</div>

  <div className="preview">{data.preview || "No content yet"}</div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
