import { Handle, Position } from "reactflow";

export default function OutputNode({ data }: any) {
  return (
    <div className="react-flow__node-default node-output">
      <div className="title">📤 {data.label}</div>
      
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
