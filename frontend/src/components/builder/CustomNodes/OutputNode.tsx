import { Handle, Position } from "reactflow";

export default function OutputNode({ data }: any) {
  return (
    <div className="react-flow__node-default node-output">
      📤 {data.label}
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
