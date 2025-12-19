interface ToolbarProps {
  addNode: (type: string, label: string) => void;
}

export default function NodeToolbar({ addNode }: ToolbarProps) {
  return (
    <div className="node-toolbar">
      <button className="toolbar-button toolbar-btn-start" onClick={() => addNode("input", "Start Node")}>➕ Add Start Node</button>
      <button className="toolbar-button toolbar-btn-ai" onClick={() => addNode("ai", "AI Node")}>🤖 Add AI Node</button>
      <button className="toolbar-button toolbar-btn-output" onClick={() => addNode("output", "Output Node")}>📤 Add Output Node</button>
    </div>
  );
}
