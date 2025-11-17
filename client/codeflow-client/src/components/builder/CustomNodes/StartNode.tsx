import { Handle, Position } from "reactflow";

export default function StartNode({ data }: any) {
  return (
    <div className="react-flow__node-default node-start">
      🟢 {data.label}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
