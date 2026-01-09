/**
 * Site Schema Types
 *
 * Purpose:
 * - Define the normalized shape for pages and sites in the builder.
 *
 * Role in the system:
 * - Acts as the canonical type contract shared by state and persistence.
 *
 * Key responsibilities:
 * - Provide typed structures for nodes, edges, and page collections.
 * - Offer helpers for creating default, empty structures.
 *
 * Important constraints and assumptions:
 * - Nodes and edges follow React Flow's data model.
 * - Defaults are intentionally minimal to avoid implicit content.
 */

import type { Node, Edge } from "reactflow";

// ================================
// Types
// ================================
export interface PageSchema {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

export interface SiteSchema {
  pages: PageSchema[];
  activePageId: string;
}

// ================================
// Factories
// ================================
/**
 * Create an empty page with no nodes or edges.
 */
export function createEmptyPage(id: string, name: string): PageSchema {
  return {
    id,
    name,
    nodes: [],
    edges: [],
  };
}

/**
 * Create a default site with a single "Home" page.
 */
export function createDefaultSite(): SiteSchema {
  return {
    pages: [createEmptyPage("home", "Home")],
    activePageId: "home",
  };
}
