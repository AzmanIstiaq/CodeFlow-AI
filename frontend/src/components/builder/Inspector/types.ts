import type { Node } from "reactflow";

export interface InspectorProps {
  selectedNodes: Node[];
  updateNode: (id: string, updates: Partial<Node["data"]>) => void;
  updateNodes: (ids: string[], updates: Partial<Node["data"]>) => void;
  deleteNode: (id: string) => void;
  deleteNodes: (ids: string[]) => void;
  allNodes: Node[];
  onClose: () => void;
}

export interface SectionProps {
  selectedNodes: Node[];
  updateNode: (id: string, updates: any) => void;
  updateNodes: (ids: string[], updates: any) => void;
  allNodes?: Node[];
}

export interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
