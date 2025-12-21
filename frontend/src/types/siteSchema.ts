import type { Node, Edge } from "reactflow";

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

export function createEmptyPage(id: string, name: string): PageSchema {
  return {
    id,
    name,
    nodes: [],
    edges: [],
  };
}

export function createDefaultSite(): SiteSchema {
  return {
    pages: [createEmptyPage("home", "Home")],
    activePageId: "home",
  };
}
