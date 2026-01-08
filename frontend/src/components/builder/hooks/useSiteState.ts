/**
 * useSiteState Hook
 *
 * Manages the global site state including pages, active page selection, and diagram persistence.
 * Handles loading diagrams from the server and provides CRUD operations for pages.
 *
 * State Structure:
 * - site: SiteSchema containing pages array and activePageId
 * - activePage: Currently selected page with its nodes and edges
 * - Page management: Create, rename, delete, and select pages
 *
 * Key Responsibilities:
 * 1. Load diagram from server on mount (if id provided)
 * 2. Maintain immutable page updates (map-based updates)
 * 3. Provide unified setState interface for nodes/edges (adapter pattern)
 * 4. Manage page lifecycle (add, delete, rename, select)
 */

import { useState, useEffect } from "react";
import type { SiteSchema, PageSchema } from "../../../types/siteSchema";
import { createDefaultSite, createEmptyPage } from "../../../types/siteSchema";
import { getDiagram } from "../../../api/api";

export function useSiteState(id: string | null) {
  // =====================================
  // STATE INITIALIZATION
  // =====================================

  const [site, setSite] = useState<SiteSchema>(createDefaultSite());

  // =====================================
  // ACTIVE PAGE COMPUTED VALUES
  // =====================================
  // Derive active page and its node/edge lists from site state
  // The '!' assertion is safe because site always has at least one page with activePageId
  const activePage = site.pages.find((p) => p.id === site.activePageId)!;
  const nodes = activePage.nodes;
  const edges = activePage.edges;

  // =====================================
  // STATE UPDATE ADAPTER FUNCTIONS
  // =====================================
  // These functions provide a unified setState interface that the rest of the app
  // expects from ReactFlow's setNodes/setEdges pattern. They convert function-based
  // or direct updates into immutable site state updates.

  const updateActivePage = (updates: Partial<PageSchema>) => {
    // Immutably update the active page using map()
    // This ensures shallow equality checks on pages array
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === prev.activePageId ? { ...p, ...updates } : p
      ),
    }));
  };

  // Adapter for node updates - supports both direct updates and functional updates
  // Pattern: ReactFlow components call setNodes(updater) or setNodes(newArray)
  const setNodes = (nodesOrUpdater: any) => {
    const newNodes =
      typeof nodesOrUpdater === "function"
        ? nodesOrUpdater(nodes)
        : nodesOrUpdater;
    updateActivePage({ nodes: newNodes });
  };

  // Adapter for edge updates - same pattern as setNodes
  const setEdges = (edgesOrUpdater: any) => {
    const newEdges =
      typeof edgesOrUpdater === "function"
        ? edgesOrUpdater(edges)
        : edgesOrUpdater;
    updateActivePage({ edges: newEdges });
  };

  // =====================================
  // PAGE MANAGEMENT OPERATIONS
  // =====================================

  /**
   * Switch active page by ID
   * Assumes page exists; caller is responsible for validation
   */
  const handlePageSelect = (pageId: string) => {
    setSite((prev) => ({ ...prev, activePageId: pageId }));
  };

  /**
   * Create new page and switch to it
   * Prompts user for page name, defaults to "Page N" if cancelled
   */
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

  /**
   * Delete page by ID
   * Switches active page to first remaining page if deleted page was active
   * Prevents deletion of all pages (not enforced here, assumes caller validates)
   */
  const handlePageDelete = (pageId: string) => {
    setSite((prev) => {
      const newPages = prev.pages.filter((p) => p.id !== pageId);
      // If we deleted the active page, switch to first remaining page
      const newActiveId =
        prev.activePageId === pageId ? newPages[0].id : prev.activePageId;
      return { pages: newPages, activePageId: newActiveId };
    });
  };

  /**
   * Rename page by ID
   * Updates page name in-place without affecting active page
   */
  const handlePageRename = (pageId: string, newName: string) => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === pageId ? { ...p, name: newName } : p
      ),
    }));
  };

  // =====================================
  // SERVER PERSISTENCE
  // =====================================

  /**
   * Load diagram from server on mount
   *
   * Flow:
   * 1. If no id provided, skip (new site)
   * 2. Call getDiagram API
   * 3. Parse response (handles both wrapped { diagram: ... } and direct object)
   * 4. If has pages, load entire site; otherwise create single "Home" page
   * 5. Catch errors silently (new diagram scenario)
   *
   * Note: This only runs once on mount because [id] dependency is stable
   */
  useEffect(() => {
    if (!id) return;

    getDiagram(Number(id))
      .then((res) => {
        // Handle both { diagram: {...} } and direct {...} response formats
        const raw = res.data && (res.data.diagram ?? res.data);
        if (!raw) return;

        const str = typeof raw === "string" ? raw : JSON.stringify(raw);
        const parsed = JSON.parse(str);

        // If already has pages structure, use it directly
        if (parsed.pages) {
          setSite(parsed);
        } else {
          // Create single page from legacy format (nodes/edges at root)
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

  // =====================================
  // HOOK EXPORTS
  // =====================================
  // Return all state and operations needed by PageBuilderInner and related components

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
