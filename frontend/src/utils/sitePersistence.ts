import type { SiteSchema } from "../types/siteSchema";

type LegacyDiagram = {
  nodes?: SiteSchema["pages"][number]["nodes"];
  edges?: SiteSchema["pages"][number]["edges"];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function serializeSite(site: SiteSchema): string {
  return JSON.stringify(site);
}

export function countSiteNodes(serialized: string | undefined): number {
  if (!serialized) return 0;

  try {
    return deserializeSite(serialized).pages.reduce(
      (total, page) => total + page.nodes.length,
      0
    );
  } catch {
    return 0;
  }
}

/**
 * Converts API responses and legacy single-page diagrams into the current site
 * schema. Invalid or empty page collections are rejected before they can break
 * the builder's active-page invariant.
 */
export function deserializeSite(input: unknown): SiteSchema {
  const wrapped = isRecord(input) && "diagram" in input ? input.diagram : input;
  if (wrapped === null || wrapped === undefined || wrapped === "") {
    throw new Error("Saved diagram is empty");
  }

  const parsed: unknown =
    typeof wrapped === "string" ? JSON.parse(wrapped) : wrapped;
  if (!isRecord(parsed)) throw new Error("Saved diagram must be an object");

  if (Array.isArray(parsed.pages)) {
    if (parsed.pages.length === 0) throw new Error("Saved site has no pages");

    const pages = parsed.pages as SiteSchema["pages"];
    const requestedActivePage =
      typeof parsed.activePageId === "string" ? parsed.activePageId : null;
    const activePageId = pages.some((page) => page.id === requestedActivePage)
      ? requestedActivePage!
      : pages[0].id;

    return { pages, activePageId };
  }

  const legacy = parsed as LegacyDiagram;
  return {
    pages: [
      {
        id: "home",
        name: "Home",
        nodes: Array.isArray(legacy.nodes) ? legacy.nodes : [],
        edges: Array.isArray(legacy.edges) ? legacy.edges : [],
      },
    ],
    activePageId: "home",
  };
}
