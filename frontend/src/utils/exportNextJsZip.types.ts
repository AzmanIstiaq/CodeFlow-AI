/**
 * File: exportNextJsZip.types.ts
 *
 * Purpose:
 * - Define shared type contracts used by the Next.js ZIP export pipeline.
 *
 * Controls:
 * - Export input schema, layout decision metadata, and normalization output shapes.
 *
 * Directly related files:
 * - frontend/src/utils/exportNextJsZip.ts
 * - frontend/src/pages/PageBuilderInner.tsx
 */

export type SiteSchema = {
  pages: Array<{
    id: string;
    name: string;
    nodes: any[];
    edges: any[];
  }>;
  activePageId: string;
};

export type TreeNode = {
  node: any;
  children: TreeNode[];
};

export type LayoutMode = "free" | "row" | "column" | "grid";

export type LayoutDecision = {
  mode: LayoutMode;
  confidence: number;
  reasons: string[];
};

export type StyleToken = {
  id: string;
  style: Record<string, any>;
  usageCount: number;
};

export type ExportOptions = {
  pixelPerfect?: boolean;
};

export type NormalizationResult = {
  normalizedNodes: TreeNode[];
  styleTokens: StyleToken[];
  nodeStyleRef: Record<string, string>;
  diagnostics: Array<{
    nodeId: string;
    parentId?: string;
    decision: LayoutDecision;
  }>;
};

export type NormalizedTreeNode = TreeNode & { layoutDecision?: LayoutDecision };
