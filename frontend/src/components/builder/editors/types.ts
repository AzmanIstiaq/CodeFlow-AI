export interface NodeEditorProps {
  localData: any;
  handleChange: (field: string, value: any) => void;
  collapsedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
}
