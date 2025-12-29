interface SaveWorkflowDialogProps {
  isOpen: boolean;
  workflowName: string;
  workflowDescription: string;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

export default function SaveWorkflowDialog({
  isOpen,
  workflowName,
  workflowDescription,
  onClose,
  onSave,
  onNameChange,
  onDescriptionChange,
}: SaveWorkflowDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Save Workflow</h2>
        <input
          type="text"
          placeholder="Enter workflow name..."
          value={workflowName}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus
          className="workflow-name-input"
        />
        <textarea
          placeholder="Enter workflow description (optional)..."
          value={workflowDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="workflow-description-input"
          rows={3}
        />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
