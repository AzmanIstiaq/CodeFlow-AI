/**
 * Save Workflow Dialog
 *
 * Purpose:
 * - Collect workflow name and description before saving.
 *
 * Role in the system:
 * - Used when saving a new workflow that does not yet have an id.
 *
 * Key responsibilities:
 * - Render a modal with controlled input fields.
 * - Delegate save and close actions to parent handlers.
 *
 * Important constraints and assumptions:
 * - Dialog is rendered only when isOpen is true.
 * - Clicks on the overlay close the dialog; inner content stops propagation.
 */

// ================================
// Types
// ================================
interface SaveWorkflowDialogProps {
  isOpen: boolean;
  workflowName: string;
  workflowDescription: string;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

// ================================
// Component
// ================================
/**
 * Modal dialog for entering workflow metadata before save.
 */
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
