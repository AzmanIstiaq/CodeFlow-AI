interface ToolbarProps {
  addNode: (type: string, label: string) => void;
  mode: "workflow" | "builder";
}

export default function NodeToolbar({ addNode, mode }: ToolbarProps) {
  return (
    <div className="node-toolbar">
      {mode === "workflow" && (
        <>
          <button
            className="toolbar-button toolbar-btn-start"
            onClick={() => addNode("input", "Start Node")}
          >
            ➕ Add Start Node
          </button>
          <button
            className="toolbar-button toolbar-btn-ai"
            onClick={() => addNode("ai", "AI Node")}
          >
            🤖 Add AI Node
          </button>
          <button
            className="toolbar-button toolbar-btn-output"
            onClick={() => addNode("output", "Output Node")}
          >
            📤 Add Output Node
          </button>
        </>
      )}

      {mode === "builder" && (
        <>
          <button
            className="toolbar-button toolbar-btn-section"
            onClick={() => addNode("section", "Section")}
          >
            📦 Add Section
          </button>
          <button
            className="toolbar-button toolbar-btn-columns"
            onClick={() => addNode("columnsSection", "Columns Section")}
          >
            ⬜ Add Columns
          </button>
          <button
            className="toolbar-button toolbar-btn-text"
            onClick={() => addNode("text", "Text Node")}
          >
            📝 Add Text Node
          </button>
          <button
            className="toolbar-button toolbar-btn-button"
            onClick={() => addNode("button", "Button")}
          >
            🔘 Add Button
          </button>
        </>
      )}
    </div>
  );
}
