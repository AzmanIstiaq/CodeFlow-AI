/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines whether the current site state is exportable.
 * If export prerequisites change, fix them HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
import type { LayoutDecision } from "../../utils/exportNextJsZip.types";

export type ExportGateResult = {
  ok: boolean;
  reasons: string[];
  diagnostics?: Array<{ nodeId: string; parentId?: string; decision: LayoutDecision }>;
};

/**
 * INVARIANT:
 * Export checks must enforce layout invariants before emitting artifacts.
 */

type NodeLike = {
  id: string;
  type?: string;
  parentNode?: string | null;
  position?: { x?: number; y?: number };
  style?: Record<string, any>;
  data?: Record<string, any>;
};

type PageLike = { id: string; nodes?: NodeLike[] };
type SiteLike = { pages?: PageLike[]; activePageId?: string | null };

const isAbsolute = (node: NodeLike) =>
  node?.style?.position === "absolute" || node?.data?.positionMode === "absolute";

const bbox = (n: NodeLike) => {
  const w = n.style?.width ?? n.data?.width ?? 0;
  const h = n.style?.height ?? n.data?.height ?? 0;
  const x = n.position?.x ?? 0;
  const y = n.position?.y ?? 0;
  return { x, y, w, h, right: x + (w ?? 0), bottom: y + (h ?? 0) };
};

const overlaps = (a: ReturnType<typeof bbox>, b: ReturnType<typeof bbox>) =>
  a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;

export function canExportSite(site: SiteLike): ExportGateResult {
  const reasons: string[] = [];
  const diagnostics: ExportGateResult["diagnostics"] = [];

  if (!site?.pages?.length) {
    return { ok: false, reasons: ["No pages in site."] };
  }

  const page =
    site.pages.find((p) => p.id === site.activePageId) ?? site.pages[0];

  if (!page) return { ok: false, reasons: ["Active page not found."] };

  const nodes = page.nodes || [];
  if (!nodes.length) reasons.push("Page has no nodes.");

  const rootNodes = nodes.filter((n) => !n.parentNode);
  const hasFrameLikeRoot = rootNodes.some((n) =>
    ["section", "frame", "container"].includes(n.type || "")
  );
  if (!hasFrameLikeRoot) reasons.push("No root section/frame/container.");

  // Overlap detection among absolute siblings (column-aware parent mapping)
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const columnOwnerIndexToId = new Map<string, string>();
  nodes.forEach((n) => {
    if (
      n.type === "column" &&
      n.data?._ownedByColumn &&
      typeof n.data?._columnIndex === "number"
    ) {
      columnOwnerIndexToId.set(
        `${n.data._ownedByColumn}:${n.data._columnIndex}`,
        n.id
      );
    }
  });

  const resolveParentForExport = (n: NodeLike) => {
    const ownerId = n.data?._ownedByColumn;
    const colIndex = n.data?._columnIndex;
    if (n.type === "column" && ownerId && nodeById.has(ownerId)) {
      return ownerId;
    }
    if (ownerId && typeof colIndex === "number" && n.type !== "column") {
      const colId = columnOwnerIndexToId.get(`${ownerId}:${colIndex}`);
      if (colId && nodeById.has(colId)) return colId;
    }
    return n.parentNode ?? null;
  };

  const byParent = new Map<string | null | undefined, NodeLike[]>();
  nodes.forEach((n) => {
    const key = resolveParentForExport(n);
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(n);
  });

  byParent.forEach((siblings, parentId) => {
    const absSiblings = siblings.filter(isAbsolute);
    for (let i = 0; i < absSiblings.length; i += 1) {
      for (let j = i + 1; j < absSiblings.length; j += 1) {
        // Allow header/footer pairing under the same parent.
        const isBarPair =
          (absSiblings[i].type === "header" && absSiblings[j].type === "footer") ||
          (absSiblings[i].type === "footer" && absSiblings[j].type === "header");
        if (isBarPair) continue;

        const a = bbox(absSiblings[i]);
        const b = bbox(absSiblings[j]);
        if (overlaps(a, b)) {
          reasons.push(
            `Overlapping absolute nodes under ${parentId ?? "root"}: ${absSiblings[i].id} & ${absSiblings[j].id}`
          );
          diagnostics?.push({
            nodeId: absSiblings[i].id,
            parentId: parentId ?? undefined,
            decision: {
              mode: "free",
              confidence: 1,
              reasons: ["absolute-overlap"],
            },
          });
        }
      }
    }
  });

  return { ok: reasons.length === 0, reasons, diagnostics };
}
