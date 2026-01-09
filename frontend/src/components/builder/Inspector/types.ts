/**
 * Inspector Types
 *
 * Purpose:
 * - Define shared prop contracts for inspector components.
 *
 * Role in the system:
 * - Provides a centralized type source for inspector panels and sections.
 *
 * Key responsibilities:
 * - Describe selection and update handlers used across inspector UI.
 *
 * Important constraints and assumptions:
 * - Node data updates are partial and propagated by parent handlers.
 */

import type { Node } from "reactflow";

// ================================
// Props
// ================================
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
