import { useState, useEffect } from "react";
import type { SiteSchema, PageSchema } from "../../../types/siteSchema";
import { createDefaultSite, createEmptyPage } from "../../../types/siteSchema";
import { getDiagram } from "../../../api/api";

export function useSiteState(id: string | null) {
  const [site, setSite] = useState<SiteSchema>(createDefaultSite());

  // Get active page
  const activePage = site.pages.find((p) => p.id === site.activePageId)!;
  const nodes = activePage.nodes;
  const edges = activePage.edges;

  const updateActivePage = (updates: Partial<PageSchema>) => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === prev.activePageId ? { ...p, ...updates } : p
      ),
    }));
  };

  const setNodes = (nodesOrUpdater: any) => {
    const newNodes =
      typeof nodesOrUpdater === "function"
        ? nodesOrUpdater(nodes)
        : nodesOrUpdater;
    updateActivePage({ nodes: newNodes });
  };

  const setEdges = (edgesOrUpdater: any) => {
    const newEdges =
      typeof edgesOrUpdater === "function"
        ? edgesOrUpdater(edges)
        : edgesOrUpdater;
    updateActivePage({ edges: newEdges });
  };

  // Page management
  const handlePageSelect = (pageId: string) => {
    setSite((prev) => ({ ...prev, activePageId: pageId }));
  };

  const handlePageAdd = () => {
    const newPageId = `page_${Date.now()}`;
    const pageName =
      prompt("Enter page name:") || `Page ${site.pages.length + 1}`;
    setSite((prev) => ({
      ...prev,
      pages: [...prev.pages, createEmptyPage(newPageId, pageName)],
      activePageId: newPageId,
    }));
  };

  const handlePageDelete = (pageId: string) => {
    setSite((prev) => {
      const newPages = prev.pages.filter((p) => p.id !== pageId);
      const newActiveId =
        prev.activePageId === pageId ? newPages[0].id : prev.activePageId;
      return { pages: newPages, activePageId: newActiveId };
    });
  };

  const handlePageRename = (pageId: string, newName: string) => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === pageId ? { ...p, name: newName } : p
      ),
    }));
  };

  // Load diagram from server
  useEffect(() => {
    if (!id) return;

    getDiagram(Number(id))
      .then((res) => {
        const raw = res.data && (res.data.diagram ?? res.data);
        if (!raw) return;

        const str = typeof raw === "string" ? raw : JSON.stringify(raw);
        const parsed = JSON.parse(str);

        if (parsed.pages) {
          setSite(parsed);
        } else {
          setSite({
            pages: [
              {
                id: "home",
                name: "Home",
                nodes: parsed.nodes || [],
                edges: parsed.edges || [],
              },
            ],
            activePageId: "home",
          });
        }
      })
      .catch(() => console.log("No saved diagram yet."));
  }, [id]);

  return {
    site,
    setSite,
    activePage,
    nodes,
    edges,
    updateActivePage,
    setNodes,
    setEdges,
    handlePageSelect,
    handlePageAdd,
    handlePageDelete,
    handlePageRename,
  };
}
