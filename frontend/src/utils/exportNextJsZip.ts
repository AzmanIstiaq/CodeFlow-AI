/**
 * File: exportNextJsZip.ts
 *
 * Purpose:
 * - Convert builder nodes into a deterministic, static Next.js export ZIP.
 *
 * Controls:
 * - Layout normalization, style tokenization, JSX generation, and ZIP assembly.
 *
 * Directly related files:
 * - frontend/src/utils/exportNextJsZip.types.ts
 * - frontend/src/utils/exportNextJsZip.templates.ts
 * - frontend/src/pages/PageBuilderInner.tsx
 */
// ✅ Refactor-only modularization.
// Types and templates extracted without altering runtime logic or output.

import JSZip from "jszip";
import { generateExportComponentFiles, GLOBAL_EXPORT_CSS } from "./exportNextJsZip.templates";
import type {
  ExportOptions,
  LayoutDecision,
  LayoutMode,
  NormalizationResult,
  NormalizedTreeNode,
  SiteSchema,
  StyleToken,
  TreeNode,
} from "./exportNextJsZip.types";

export type { LayoutMode, LayoutDecision, NormalizationResult };

// 🔧 To change export template components, edit: `frontend/src/utils/exportNextJsZip.templates.ts`.
// 🔧 To change export data contracts, edit: `frontend/src/utils/exportNextJsZip.types.ts`.
const EPS = 4;
const GAP_STD_THRESHOLD = 6;
const STRUCTURE_CONFIDENCE = 0.75;

/* =========================
   Utilities
========================= */

const roundValue = (value: any): any => {
  if (typeof value === "number") {
    return Math.round(value * 100) / 100; // Round to 2 decimals
  }
  return value;
};

const styleValue = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  const rounded = roundValue(value);
  if (typeof rounded === "number") return rounded.toString();
  if (typeof rounded === "string") return JSON.stringify(rounded);
  return null;
};

const styleToPropString = (style: Record<string, any>) => {
  const entries = Object.entries(style).reduce<string[]>(
    (acc, [key, value]) => {
      const formatted = styleValue(value);
      if (formatted !== null) acc.push(`${key}: ${formatted}`);
      return acc;
    },
    []
  );
  return entries.length ? ` style={{ ${entries.join(", ")} }}` : "";
};

const attrsToPropString = (attrs: Record<string, any>) => {
  const entries = Object.entries(attrs).reduce<string[]>(
    (acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      if (typeof value === "boolean") {
        if (value) acc.push(` ${key}`);
        return acc;
      }
      if (typeof value === "number") {
        acc.push(` ${key}={${value}}`);
        return acc;
      }
      if (typeof value === "string") {
        acc.push(` ${key}=${JSON.stringify(value)}`);
        return acc;
      }
      acc.push(` ${key}={${JSON.stringify(value)}}`);
      return acc;
    },
    []
  );
  return entries.join("");
};

// Map a style object to Tailwind utility classes when possible; fallback to inline style for the rest.
const styleToTailwind = (style: Record<string, any>) => {
  const classes: string[] = [];
  const rest: Record<string, any> = {};

  const toPx = (v: any) =>
    typeof v === "number" ? `${v}px` : typeof v === "string" ? v : undefined;
  const isZeroSpace = (v: any) => {
    if (typeof v === "number") return v === 0;
    if (typeof v !== "string") return false;
    const normalized = v.trim().toLowerCase();
    return normalized === "0" || normalized === "0px";
  };
  const canUseArbitraryValue = (v: any) =>
    typeof v === "number" || (typeof v === "string" && !/\s/.test(v));

  const consume = (key: string) => {
    const v = style[key];
    if (v === undefined) return undefined;
    delete rest[key];
    return v;
  };

  // start with full copy
  Object.assign(rest, style || {});

  const display = consume("display");
  if (display === "flex" || display === "grid" || display === "block") {
    classes.push(display);
  } else if (display === "inline-block") classes.push("inline-block");

  const fd = consume("flexDirection");
  if (fd === "row") classes.push("flex-row");
  else if (fd === "column") classes.push("flex-col");

  const jc = consume("justifyContent");
  if (jc === "center") classes.push("justify-center");
  else if (jc === "flex-start") classes.push("justify-start");
  else if (jc === "flex-end") classes.push("justify-end");
  else if (jc === "space-between") classes.push("justify-between");
  else if (jc === "space-around") classes.push("justify-around");
  else if (jc === "space-evenly") classes.push("justify-evenly");

  const ai = consume("alignItems");
  if (ai === "center") classes.push("items-center");
  else if (ai === "flex-start") classes.push("items-start");
  else if (ai === "flex-end") classes.push("items-end");
  else if (ai === "stretch") classes.push("items-stretch");

  const gap = consume("gap");
  if (gap !== undefined && !isZeroSpace(gap)) classes.push(`gap-[${toPx(gap)}]`);
  const rowGap = consume("rowGap");
  if (rowGap !== undefined && !isZeroSpace(rowGap))
    classes.push(`gap-y-[${toPx(rowGap)}]`);
  const colGap = consume("columnGap");
  if (colGap !== undefined && !isZeroSpace(colGap))
    classes.push(`gap-x-[${toPx(colGap)}]`);

  const width = consume("width");
  if (width !== undefined) classes.push(`w-[${toPx(width)}]`);
  const minWidth = consume("minWidth");
  if (minWidth !== undefined) classes.push(`min-w-[${toPx(minWidth)}]`);
  const maxWidth = consume("maxWidth");
  if (maxWidth !== undefined) classes.push(`max-w-[${toPx(maxWidth)}]`);

  const height = consume("height");
  if (height !== undefined) classes.push(`h-[${toPx(height)}]`);
  const minHeight = consume("minHeight");
  if (minHeight !== undefined) classes.push(`min-h-[${toPx(minHeight)}]`);
  const maxHeight = consume("maxHeight");
  if (maxHeight !== undefined) classes.push(`max-h-[${toPx(maxHeight)}]`);

  const padding = consume("padding");
  if (padding !== undefined) {
    if (canUseArbitraryValue(padding)) classes.push(`p-[${toPx(padding)}]`);
    else rest.padding = padding;
  }
  const paddingTop = consume("paddingTop");
  if (paddingTop !== undefined) classes.push(`pt-[${toPx(paddingTop)}]`);
  const paddingBottom = consume("paddingBottom");
  if (paddingBottom !== undefined) classes.push(`pb-[${toPx(paddingBottom)}]`);
  const paddingLeft = consume("paddingLeft");
  if (paddingLeft !== undefined) classes.push(`pl-[${toPx(paddingLeft)}]`);
  const paddingRight = consume("paddingRight");
  if (paddingRight !== undefined) classes.push(`pr-[${toPx(paddingRight)}]`);

  const margin = consume("margin");
  if (margin !== undefined) {
    if (canUseArbitraryValue(margin)) classes.push(`m-[${toPx(margin)}]`);
    else rest.margin = margin;
  }
  const marginTop = consume("marginTop");
  if (marginTop !== undefined) classes.push(`mt-[${toPx(marginTop)}]`);
  const marginBottom = consume("marginBottom");
  if (marginBottom !== undefined) classes.push(`mb-[${toPx(marginBottom)}]`);
  const marginLeft = consume("marginLeft");
  if (marginLeft !== undefined) classes.push(`ml-[${toPx(marginLeft)}]`);
  const marginRight = consume("marginRight");
  if (marginRight !== undefined) classes.push(`mr-[${toPx(marginRight)}]`);

  const bg = consume("backgroundColor");
  if (bg) classes.push(`bg-[${bg}]`);

  const color = consume("color");
  if (color) classes.push(`text-[${color}]`);

  const radius = consume("borderRadius");
  if (radius !== undefined) classes.push(`rounded-[${toPx(radius)}]`);

  const order = consume("order");
  const numericOrder =
    typeof order === "number"
      ? order
      : typeof order === "string" && order.trim() !== ""
        ? Number(order)
        : NaN;
  if (order !== undefined && Number.isFinite(numericOrder) && numericOrder !== 0) {
    classes.push(`order-[${numericOrder}]`);
  }

  const pos = consume("position");
  if (pos === "relative") classes.push("relative");
  else if (pos === "absolute") classes.push("absolute");

  const top = consume("top");
  if (top !== undefined) classes.push(`top-[${toPx(top)}]`);
  const left = consume("left");
  if (left !== undefined) classes.push(`left-[${toPx(left)}]`);
  const right = consume("right");
  if (right !== undefined) classes.push(`right-[${toPx(right)}]`);
  const bottom = consume("bottom");
  if (bottom !== undefined) classes.push(`bottom-[${toPx(bottom)}]`);

  // Remove already-consumed keys from rest
  // (consume removed them via delete rest[key])

  // Clean empty rest entries
  Object.keys(rest).forEach((k) => {
    if (rest[k] === undefined) delete rest[k];
  });

  return { className: classes.filter(Boolean).join(" "), rest };
};

const applyCornerRadius = (target: Record<string, any>, radius: any) => {
  if (radius === undefined || radius === null) return;

  // Only apply if radius is explicitly defined - never infer defaults
  if (typeof radius === "number") {
    target.borderRadius = radius;
    return;
  }

  if (typeof radius === "object") {
    const { tl, tr, br, bl, topLeft, topRight, bottomRight, bottomLeft } =
      radius as any;
    const r1 = tl ?? topLeft;
    const r2 = tr ?? topRight;
    const r3 = br ?? bottomRight;
    const r4 = bl ?? bottomLeft;

    // Only set if at least one corner is explicitly defined
    if (
      r1 !== undefined ||
      r2 !== undefined ||
      r3 !== undefined ||
      r4 !== undefined
    ) {
      if (r1 === r2 && r1 === r3 && r1 === r4) {
        // All corners equal - use uniform radius
        target.borderRadius = r1;
      } else {
        // Asymmetric - preserve per-corner values
        if (r1 !== undefined) target.borderTopLeftRadius = r1;
        if (r2 !== undefined) target.borderTopRightRadius = r2;
        if (r3 !== undefined) target.borderBottomRightRadius = r3;
        if (r4 !== undefined) target.borderBottomLeftRadius = r4;
      }
    }
  }
};

const sortNodes = (a: any, b: any) => {
  const priority = (node: any) => {
    if (node.type === "header") return -1;
    if (node.type === "footer") return 1;
    return 0;
  };
  const pa = priority(a);
  const pb = priority(b);
  if (pa !== pb) return pa - pb;

  const oa = a.data?.order ?? a.data?._order ?? 0;
  const ob = b.data?.order ?? b.data?._order ?? 0;
  if (oa !== ob) return oa - ob;
  return a.id.localeCompare(b.id);
};

/* =========================
   Tree Builder
========================= */

const buildTree = (nodes: any[]): TreeNode[] => {
  const byParent: Record<string, any[]> = {};
  const roots: any[] = [];
  const nodeById = new Map<string, any>();
  const columnOwnerIndexToId = new Map<string, string>();

  nodes.forEach((n) => {
    nodeById.set(n.id, n);
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

  const resolveParentForExport = (n: any) => {
    const ownerId = n.data?._ownedByColumn;
    const colIndex = n.data?._columnIndex;
    if (n.type === "column" && ownerId && nodeById.has(ownerId)) {
      return ownerId;
    }
    if (
      ownerId &&
      typeof colIndex === "number" &&
      n.type !== "column" &&
      n.parentNode !== undefined
    ) {
      const colId = columnOwnerIndexToId.get(`${ownerId}:${colIndex}`);
      if (colId && nodeById.has(colId)) return colId;
    }
    return n.parentNode;
  };

  nodes.forEach((n) => {
    const pid = resolveParentForExport(n);
    if (pid) {
      byParent[pid] ||= [];
      byParent[pid].push(n);
    } else {
      roots.push(n);
    }
  });

  const attach = (node: any): TreeNode => ({
    node,
    children: (byParent[node.id] || []).sort(sortNodes).map(attach),
  });

  return roots.sort(sortNodes).map(attach);
};

/* =========================
   Stage 2: Normalize
   - Analyze node positions to choose safe layout modes.
   - Canonicalize styles into reusable tokens.
   - Attach layout decisions to the tree for exporter use.
========================= */

type BoundingBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
};

// Gracefully parse numeric-ish values with a fallback.
const coerceNumber = (value: any, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Compute bounding box and derived centers for a node.

const computeBBox = (node: any): BoundingBox => {
  const style = node?.style || {};
  const data = node?.data || {};
  const w = coerceNumber(style.width ?? data.width, 100);
  const h = coerceNumber(style.height ?? data.height, 100);
  const x = coerceNumber(node?.position?.x, 0);
  const y = coerceNumber(node?.position?.y, 0);
  const left = x;
  const top = y;
  const right = x + w;
  const bottom = y + h;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  return { x, y, w, h, left, right, top, bottom, cx, cy };
};

// Inclusive AABB overlap with small epsilon to detect near-touching items.
const overlaps = (a: BoundingBox, b: BoundingBox) => {
  return !(
    a.right <= b.left + EPS ||
    b.right <= a.left + EPS ||
    a.bottom <= b.top + EPS ||
    b.bottom <= a.top + EPS
  );
};

const average = (values: number[]) =>
  values.length === 0
    ? 0
    : values.reduce((acc, v) => acc + v, 0) / values.length;

const stddev = (values: number[]) => {
  if (values.length === 0) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
};

// Sort children along primary axis and measure gaps/uniformity.

const computeGapStats = (
  boxes: Array<{ id: string; box: BoundingBox }>,
  mode: LayoutMode
) => {
  if (boxes.length < 2) return { gaps: [] as number[], mean: 0, std: 0 };
  const sorted = [...boxes].sort((a, b) => {
    if (mode === "column") {
      return a.box.top - b.box.top || a.box.cx - b.box.cx;
    }
    return a.box.left - b.box.left || a.box.cy - b.box.cy;
  });

  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const curr = sorted[i].box;
    const next = sorted[i + 1].box;
    const gap =
      mode === "column" ? next.top - curr.bottom : next.left - curr.right;
    gaps.push(Math.max(0, gap));
  }

  const mean = average(gaps);
  const sd = stddev(gaps);
  return { gaps, mean, std: sd };
};

// Decide whether a parent can safely adopt a structured layout for its children.
const analyzeChildrenLayout = (
  _parent: any,
  children: TreeNode[]
): LayoutDecision => {
  const hasExplicitFreeChildren = children.some(
    (c) => c.node.data?.layout === "free"
  );

  if (hasExplicitFreeChildren) {
    return {
      mode: "free",
      confidence: 1,
      reasons: ["explicit-free-layout"],
    };
  }

  const hasManualPositioning = children.some((c) => {
    const s = c.node.style || {};
    return (
      s.position === "absolute" ||
      s.left !== undefined ||
      s.right !== undefined ||
      s.top !== undefined ||
      s.bottom !== undefined
    );
  });

  if (hasManualPositioning) {
    return {
      mode: "free",
      confidence: 1,
      reasons: ["manual-positioning"],
    };
  }

  if (!children.length) {
    return { mode: "free", confidence: 1, reasons: ["no-children"] };
  }

  const boxes = children.map((c) => ({
    id: c.node.id,
    box: computeBBox(c.node),
  }));

  const spreadX =
    Math.max(...boxes.map((b) => b.box.right)) -
    Math.min(...boxes.map((b) => b.box.left));
  const spreadY =
    Math.max(...boxes.map((b) => b.box.bottom)) -
    Math.min(...boxes.map((b) => b.box.top));

  if (spreadX > 600 || spreadY > 600) {
    return { mode: "free", confidence: 1, reasons: ["canvas-spread"] };
  }

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (overlaps(boxes[i].box, boxes[j].box)) {
        return { mode: "free", confidence: 1, reasons: ["overlap-detected"] };
      }
    }
  }

  const cyVals = boxes.map((b) => b.box.cy);
  const cxVals = boxes.map((b) => b.box.cx);
  const meanCy = average(cyVals);
  const meanCx = average(cxVals);
  const maxCyDelta = Math.max(...cyVals.map((cy) => Math.abs(cy - meanCy)));
  const maxCxDelta = Math.max(...cxVals.map((cx) => Math.abs(cx - meanCx)));
  const rowAligned = maxCyDelta <= EPS;
  const colAligned = maxCxDelta <= EPS;

  let candidate: LayoutMode | null = null;
  if (rowAligned) candidate = "row";
  if (colAligned && children.length > 2)
    candidate = candidate ? "grid" : "column";
  if (!candidate) {
    return { mode: "free", confidence: 0.6, reasons: ["no-axis-alignment"] };
  }

  const gaps = computeGapStats(boxes, candidate === "grid" ? "row" : candidate);
  const secondaryDelta = candidate === "column" ? maxCxDelta : maxCyDelta;
  const reasons: string[] = [];
  let confidence = 1;
  if (gaps.std > GAP_STD_THRESHOLD) {
    confidence -= 0.25;
    reasons.push("gap-variance");
  }
  if (secondaryDelta > EPS) {
    confidence -= 0.25;
    reasons.push("off-axis-nudge");
  }
  if (candidate === "grid") {
    confidence -= 0.2;
    reasons.push("ambiguous-grid");
  }
  confidence = Math.max(0, Math.min(1, confidence));

  if (secondaryDelta > EPS || confidence < STRUCTURE_CONFIDENCE) {
    return {
      mode: "free",
      confidence: Math.max(confidence, 0.5),
      reasons: reasons.length ? reasons : ["low-confidence"],
    };
  }

  const finalMode: LayoutMode = candidate === "grid" ? "grid" : candidate;

  return {
    mode: finalMode,
    confidence,
    reasons: reasons.length ? reasons : [`aligned-${finalMode}`],
  };
};

// Layout-related props must NEVER be part of style tokens

const STRIP_FROM_TOKENS = new Set([
  "display",
  "flexDirection",
  "gridTemplateColumns",
  "gridTemplateRows",
  "gap",
  "rowGap",
  "columnGap",
  "position",
  "left",
  "right",
  "top",
  "bottom",
]);

// Merge, sort, and round a style object so it can be hashed deterministically.
const canonicalizeStyle = (style: Record<string, any>) => {
  const entries = Object.entries(style || {})
    .filter(
      ([k, v]) => v !== undefined && v !== null && !STRIP_FROM_TOKENS.has(k) // 🔒 strip layout props
    )
    .map(([k, v]) => [k, typeof v === "number" ? Math.round(v * 100) / 100 : v])
    .sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries);
};

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
};

// Deduplicate styles across nodes into stable tokens (s_0001, s_0002, ...).

const createStyleTokens = (nodes: any[]) => {
  const tokens: StyleToken[] = [];
  const nodeStyleRef: Record<string, string> = {};
  const cache = new Map<string, string>();
  const tokenMap = new Map<string, StyleToken>();
  nodes.forEach((n) => {
    const mergedRaw = { ...(n.style || {}), ...(n.data?.style || {}) };
    const merged: Record<string, any> = {};
    for (const [key, value] of Object.entries(mergedRaw)) {
      if (!STRIP_FROM_TOKENS.has(key)) {
        merged[key] = value;
      }
    }

    const canonical = canonicalizeStyle(merged);
    const json = JSON.stringify(canonical);
    const signature = `${hashString(json)}:${json}`;

    let tokenId = cache.get(signature);

    if (!tokenId) {
      tokenId = `s_${(tokens.length + 1).toString().padStart(4, "0")}`;
      const token: StyleToken = {
        id: tokenId,
        style: canonical,
        usageCount: 0,
      };
      tokens.push(token);
      cache.set(signature, tokenId);
      tokenMap.set(tokenId, token);
    }
    nodeStyleRef[n.id] = tokenId;
    const token = tokenMap.get(tokenId);
    if (token) token.usageCount += 1;
  });
  return { styleTokens: tokens, nodeStyleRef };
};

// Collect all nodes for style tokenization.

const flattenTree = (roots: TreeNode[]) => {
  const collected: any[] = [];
  const visit = (tree: TreeNode) => {
    collected.push(tree.node);
    tree.children.forEach(visit);
  };
  roots.forEach(visit);
  return collected;
};

// Stage 2 normalization: attach layout decisions + shared style tokens ahead of export.
// Baking these choices here keeps the generated Next.js page free of layout heuristics at runtime.
// Diagnostics capture the confidence trail so downstream tooling can surface potential drift.
const normalizeTree = (roots: TreeNode[]): NormalizationResult => {
  const diagnostics: NormalizationResult["diagnostics"] = [];
  const annotate = (tree: TreeNode, parentId?: string) => {
    const decision = analyzeChildrenLayout(tree.node, tree.children);
    (tree as NormalizedTreeNode).layoutDecision = decision;
    (tree.node as any).layoutDecision = decision;
    diagnostics.push({ nodeId: tree.node.id, parentId, decision });
    tree.children.forEach((child) => annotate(child, tree.node.id));
  };
  roots.forEach((root) => annotate(root));

  const allNodes = flattenTree(roots);
  const { styleTokens, nodeStyleRef } = createStyleTokens(allNodes);
  return { normalizedNodes: roots, styleTokens, nodeStyleRef, diagnostics };
};

// Public entry: normalize a flat node list (page) into all Stage 2 outputs.
export const normalizePageNodes = (nodes: any[]): NormalizationResult => {
  const tree = buildTree(nodes || []);
  return normalizeTree(tree);
};

/* =========================
   Text Semantics
========================= */

const headingForFontSize = (size?: number) => {
  if (!size) return "p";
  if (size >= 36) return "h1";
  if (size >= 28) return "h2";
  if (size >= 22) return "h3";
  if (size >= 18) return "h4";
  return "p";
};

// Estimate gap from child geometry to keep structured layouts visually stable.
const inferGapFromChildren = (mode: LayoutMode, children: TreeNode[]) => {
  if (!children || children.length < 2) return undefined;
  const boxes = children.map((c) => computeBBox(c.node));
  const sorted =
    mode === "column"
      ? [...boxes].sort((a, b) => a.top - b.top || a.cx - b.cx)
      : [...boxes].sort((a, b) => a.left - b.left || a.cy - b.cy);
  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    const gap =
      mode === "column" ? next.top - curr.bottom : next.left - curr.right;
    gaps.push(Math.max(0, gap));
  }
  if (!gaps.length) return undefined;
  return roundValue(average(gaps));
};

/* =========================
   Core JSX Generator
========================= */

const applyHorizontalPositioning = (
  baseStyle: any,
  relativeX: number | undefined,
  originalLeft: any,
  originalRight: any,
  widthHint: number | undefined,
  frameWidth?: number,
  node?: any
): void => {
  // If original right/left exists, use them
  if (originalRight !== undefined) {
    baseStyle.right = originalRight;
    delete baseStyle.left;
  } else if (originalLeft !== undefined) {
    baseStyle.left = originalLeft;
    delete baseStyle.right;
  } else if (relativeX !== undefined && frameWidth && widthHint) {
    // Calculate distances: left edge vs right edge
    const distanceFromLeft = relativeX;
    const distanceFromRight = frameWidth - (relativeX + widthHint);

    // Use whichever edge is closer
    if (distanceFromRight < distanceFromLeft) {
      baseStyle.right = distanceFromRight;
      delete baseStyle.left;
    } else {
      baseStyle.left = relativeX;
      delete baseStyle.right;
    }
  } else if (relativeX !== undefined && frameWidth && node.type === "button") {
    // For buttons without explicit width, estimate based on text content
    const text = node.data?.label || node.data?.text || "Button";
    const estimatedWidth = Math.max(80, text.length * 8 + 40); // Rough estimate
    const distanceFromLeft = relativeX;
    const distanceFromRight = frameWidth - (relativeX + estimatedWidth);

    if (distanceFromRight < distanceFromLeft) {
      baseStyle.right = distanceFromRight;
      delete baseStyle.left;
    } else {
      baseStyle.left = relativeX;
      delete baseStyle.right;
    }
  } else if (relativeX !== undefined) {
    baseStyle.left = relativeX;
    delete baseStyle.right;
  }
};

const applyVerticalPositioning = (
  baseStyle: any,
  relativeY: number | undefined,
  originalTop: any,
  originalBottom: any
) => {
  // If original top/bottom exists, use them
  if (originalBottom !== undefined) {
    baseStyle.bottom = originalBottom;
    delete baseStyle.top;
  } else if (originalTop !== undefined) {
    baseStyle.top = originalTop;
    delete baseStyle.bottom;
  } else if (relativeY !== undefined) {
    baseStyle.top = relativeY;
    delete baseStyle.bottom;
  }
};

const resolveColumnCount = (data: any, children: TreeNode[]) => {
  // Extract numeric column count from various metadata formats
  let colCount: number | undefined;
  if (typeof data?.columns === "number") colCount = data.columns;
  else if (typeof data?.columns?.count === "number")
    colCount = data.columns.count;
  else if (typeof data?.columnCount === "number") colCount = data.columnCount;

  // Fallback to child count if no explicit metadata
  if (colCount === undefined) colCount = Math.max(1, children.length || 1);

  // Ensure numeric return
  return typeof colCount === "number" ? colCount : 1;
};

const resolveColumnsGap = (data: any, fallback: number) => {
  const explicitGap =
    data?.columns?.gap ?? data?.columnGap ?? data?.gapBetweenColumns;
  if (typeof explicitGap === "number") return explicitGap;
  return fallback;
};

const normalizeAxisToken = (value: any) =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase();

  // Render a normalized tree node into static JSX while respecting flow vs absolute layout intent.
  // LayoutMode steers flex/grid wrapping so the exported page avoids recomputing structure at runtime.
  // Assumes upstream normalization baked in positions/styles; this layer only formats safe markup.
const nodeToJSX = (
  tree: NormalizedTreeNode,

  indent = 6,

  parentLayoutMode: LayoutMode = "free",

  parentHasAbsolutePos = false,

  frameWidth?: number,

  styleCtx?: {
    styleTokenMap: Record<string, StyleToken>;
    nodeStyleRef: Record<string, string>;
  },
  parentPosition?: { x?: number; y?: number },
  parentLayoutOffset?: { x?: number; y?: number },
  parentCrossAxisStretch = false,
  options: ExportOptions = {}
): string => {
  const pixelPerfect = options.pixelPerfect === true;
  const { node, children } = tree;
  const data = node.data || {};

  const layoutDecision = tree.layoutDecision;

  // Only respect structured layout if confidence is high enough; otherwise treat as free/absolute.

  const layoutModeForChildren: LayoutMode =
    layoutDecision && layoutDecision.confidence >= STRUCTURE_CONFIDENCE
      ? layoutDecision.mode
      : "free";

  const tokenId = styleCtx?.nodeStyleRef?.[node.id];

  const tokenStyle = tokenId
    ? styleCtx?.styleTokenMap?.[tokenId]?.style
    : undefined;

  const baseStyle: Record<string, any> = tokenStyle
    ? { ...tokenStyle }
    : {
        ...(node.style || {}),

        ...(data.style || {}),
      };
  // Preserve ordering when layout relies on order metadata
  if (data.order !== undefined || data._order !== undefined) {
    baseStyle.order = data.order ?? data._order;
  }

  const layoutModeIsFree =
    layoutModeForChildren === "free" || layoutDecision?.mode === "free";

  const stripLayoutPropsForFreeMode = () => {
    if (!layoutModeIsFree || pixelPerfect) return;
    delete baseStyle.display;
    delete baseStyle.flexDirection;
    delete baseStyle.gridTemplateColumns;
    delete baseStyle.gridTemplateRows;
    delete baseStyle.gap;
    delete baseStyle.rowGap;
    delete baseStyle.columnGap;
  };

  // Capture original positioning values before deletion
  const originalRight = baseStyle.right;
  const originalLeft = baseStyle.left;
  const originalBottom = baseStyle.bottom;
  const originalTop = baseStyle.top;

  // Capture dimensional hints before stripping canvas geometry.
  const widthHint = baseStyle.width ?? data.width;
  const heightHint = baseStyle.height ?? data.height;
  const positionX = node.position?.x;
  const positionY = node.position?.y;

  const parentX =
    (parentHasAbsolutePos ? parentPosition?.x : parentLayoutOffset?.x) ?? 0;
  const parentY =
    (parentHasAbsolutePos ? parentPosition?.y : parentLayoutOffset?.y) ?? 0;

  const relativeX =
    typeof positionX === "number" ? positionX - parentX : undefined;
  const relativeY =
    typeof positionY === "number" ? positionY - parentY : undefined;

  // Remove canvas positioning only if in structured layouts (row/column/grid)
  const inStructuredLayout = parentLayoutMode !== "free";

  const hasExplicitAbsolutePosition =
    data.positionMode === "absolute" ||
    baseStyle.position === "absolute" ||
    originalLeft !== undefined ||
    originalRight !== undefined ||
    originalTop !== undefined ||
    originalBottom !== undefined;

  // In free layout, only explicit absolute nodes should be emitted as absolute.
  const shouldExportAsAbsolute =
    hasExplicitAbsolutePosition &&
    typeof positionX === "number" &&
    typeof positionY === "number";

  // Handle positioning - export coordinates exactly as-is, no offset subtraction
  if (inStructuredLayout) {
    const mode = node.data?.positionMode;
    const isAbs = mode === "absolute";

    if (isAbs) {
      // Only true absolute children keep offsets inside structured parents
      baseStyle.position = "absolute";
      applyHorizontalPositioning(
        baseStyle,
        relativeX,
        originalLeft,
        originalRight,
        widthHint,
        frameWidth,
        node
      );
      applyVerticalPositioning(baseStyle, relativeY, originalTop, originalBottom);
    } else {
      // Flow or unspecified -> let parent layout place them
      delete baseStyle.position;
      delete baseStyle.left;
      delete baseStyle.top;
      delete baseStyle.right;
      delete baseStyle.bottom;
      delete baseStyle.x;
      delete baseStyle.y;
    }
  } else if (shouldExportAsAbsolute) {
    // Absolutely positioned - preserve original positioning (left/right/top/bottom)
    baseStyle.position = "absolute";

    // Apply horizontal positioning with right/left detection
    applyHorizontalPositioning(
      baseStyle,
      relativeX,
      originalLeft,
      originalRight,
      widthHint,
      frameWidth,
      node
    );

    // Apply vertical positioning with top/bottom detection
    applyVerticalPositioning(baseStyle, relativeY, originalTop, originalBottom);
  } else {
    // Default: remove positioning for non-absolute nodes
    delete baseStyle.position;
    delete baseStyle.left;
    delete baseStyle.top;
    delete baseStyle.right;
    delete baseStyle.bottom;
    delete baseStyle.x;
    delete baseStyle.y;
  }

  if (!pixelPerfect) {
    delete baseStyle.zIndex;
    delete baseStyle.transform;
  }
  const keepNodeDimensions =
    node.type === "section" ||
    node.type === "container" ||
    node.type === "columns" ||
    node.type === "column" ||
    node.type === "row" ||
    node.type === "button" ||
    node.type === "shape" ||
    node.type === "header" ||
    node.type === "footer" ||
    data.keepSizeInExport === true;

  // In responsive mode, trim fixed geometry for generic nodes but keep container/layout dimensions.
  if (
    !pixelPerfect &&
    baseStyle.position !== "absolute" &&
    !keepNodeDimensions
  ) {
    delete baseStyle.width;
    delete baseStyle.height;
    delete baseStyle.left;
    delete baseStyle.top;
  }

  // In stretched columns, flow children should fill column width.
  if (
    parentCrossAxisStretch &&
    parentLayoutMode === "column" &&
    data.positionMode !== "absolute" &&
    baseStyle.position !== "absolute"
  ) {
    baseStyle.width = "100%";
    delete baseStyle.maxWidth;
  }

  const structuredGap =
    layoutModeForChildren !== "free"
      ? inferGapFromChildren(
          layoutModeForChildren === "grid" ? "row" : layoutModeForChildren,

          children
        )
      : undefined;

  let tag = "div";
  let content = "";
  let isSelfClosing = false;
  let imageSrc = "";
  let imageAlt = "";
  const extraAttrs: Record<string, any> = {};

  switch (node.type) {
    case "page":
    case "frame":
      tag = "CanvasSection";
      // baseStyle.position = "relative";

      if (layoutModeForChildren === "row") {
        baseStyle.display ||= "flex";

        baseStyle.flexDirection ||= "row";

        baseStyle.gap ||= data.gap ?? structuredGap ?? 32;
      } else if (layoutModeForChildren === "column") {
        baseStyle.display ||= "flex";

        baseStyle.flexDirection ||= "column";

        baseStyle.gap ||= data.gap ?? structuredGap ?? 32;
      } else if (layoutModeForChildren === "grid") {
        baseStyle.display ||= "grid";

        if (layoutModeForChildren === "grid") {
          baseStyle.gridTemplateColumns ||= `repeat(${resolveColumnCount(
            data,

            children
          )}, 1fr)`;
        }

        baseStyle.gap ||= data.gap ?? structuredGap ?? 32;
      } else {
        baseStyle.display = "block";

        // 🔒 Hard stop: free-layout containers must not carry layout props

        delete baseStyle.gridTemplateColumns;

        delete baseStyle.gridTemplateRows;

        delete baseStyle.flexDirection;

        delete baseStyle.gap;

        delete baseStyle.rowGap;

        delete baseStyle.columnGap;
      }

      baseStyle.margin ||= "0 auto";

      if (widthHint) baseStyle.width ??= widthHint;

      if (heightHint) baseStyle.minHeight ??= heightHint;

      if (data.backgroundColor)
        baseStyle.backgroundColor ||= data.backgroundColor;
      break;

    case "section":
    case "container":
      tag = "CanvasSection";
      const hasColumnChildren = children.some((c) => c.node.type === "column");

      const hasAbsoluteChildren = children.some((c) => {
        const s = c.node.style || {};
        return (
          s.position === "absolute" ||
          s.left !== undefined ||
          s.right !== undefined ||
          s.top !== undefined ||
          s.bottom !== undefined
        );
      });

      baseStyle.backgroundColor ||= data.backgroundColor ?? "transparent";
      applyCornerRadius(baseStyle, data.borderRadius ?? data.radius);

      if (hasColumnChildren) {
        // If semantic column wrappers exist under this container, preserve equal-width columns.
        baseStyle.display ||= "grid";
        baseStyle.gridTemplateColumns ||= `repeat(${Math.max(
          1,
          children.filter((c) => c.node.type === "column").length
        )}, 1fr)`;
        baseStyle.gap = resolveColumnsGap(data, 0);
      } else if (layoutModeForChildren === "row") {
        baseStyle.display ||= "flex";
        baseStyle.flexDirection ||= "row";
        baseStyle.gap ||= data.gap ?? structuredGap ?? 16;
      } else if (layoutModeForChildren === "column") {
        baseStyle.display ||= "flex";
        baseStyle.flexDirection ||= "column";
        baseStyle.gap ||= data.gap ?? structuredGap ?? 16;
      } else if (layoutModeForChildren === "grid") {
        baseStyle.display ||= "grid";
        baseStyle.gridTemplateColumns ||= `repeat(${resolveColumnCount(
          data,
          children
        )}, 1fr)`;
        baseStyle.gap ||= data.gap ?? structuredGap ?? 16;
      } else {
        baseStyle.display = "block";
      }
      baseStyle.position ||= "relative";
      if (hasAbsoluteChildren) {
        baseStyle.position = "relative";
      }

      // Only set absolute position on section itself if it's a direct canvas child
      if (
        shouldExportAsAbsolute &&
        !inStructuredLayout &&
        !parentHasAbsolutePos
      ) {
        baseStyle.position = "absolute";
        if (widthHint) baseStyle.width = widthHint;
        if (heightHint) baseStyle.height = heightHint;
      }
      break;

    case "header":
    case "footer": {
      tag = node.type === "header" ? "CanvasHeader" : "CanvasFooter";
      // Force bars to flow in document order; ignore canvas positioning for stacking safety.
      baseStyle.position = "relative";
      delete baseStyle.left;
      delete baseStyle.right;
      delete baseStyle.top;
      delete baseStyle.bottom;
      delete baseStyle.transform;
      baseStyle.width = "100%";
      baseStyle.margin = "0 auto";
      if (heightHint) {
        baseStyle.height = heightHint;
        baseStyle.minHeight = heightHint;
      }
      baseStyle.padding = data.padding ?? 24;
      baseStyle.backgroundColor = data.backgroundColor ?? "transparent";
      baseStyle.border = "none"; // remove canvas border for cleaner export
      applyCornerRadius(baseStyle, data.borderRadius ?? data.radius);

      if (layoutModeForChildren === "row") {
        baseStyle.display = "flex";
        baseStyle.flexDirection = "row";
        baseStyle.gap = data.gap ?? structuredGap ?? 16;
      } else if (layoutModeForChildren === "column") {
        baseStyle.display = "flex";
        baseStyle.flexDirection = "column";
        baseStyle.gap = data.gap ?? structuredGap ?? 16;
      } else if (layoutModeForChildren === "grid") {
        baseStyle.display = "grid";
        baseStyle.gridTemplateColumns = `repeat(${resolveColumnCount(
          data,
          children
        )}, 1fr)`;
        baseStyle.gap = data.gap ?? structuredGap ?? 16;
      } else {
        baseStyle.display = "block";
      }
      baseStyle.boxSizing = "border-box";
      break;
    }

    case "row": {
      tag = "CanvasRow";
      const hasColumnChildren = children.some((c) => c.node.type === "column");

      if (hasColumnChildren) {
        // Rows that own column nodes should always export as equal grid columns.
        baseStyle.display ||= "grid";
        baseStyle.gridTemplateColumns ||= `repeat(${Math.max(
          1,
          children.filter((c) => c.node.type === "column").length
        )}, 1fr)`;
        baseStyle.gap = resolveColumnsGap(data, 0);
      } else if (layoutModeForChildren === "row") {
        baseStyle.display ||= "flex";

        baseStyle.flexDirection ||= "row";

        baseStyle.gap ||= data.gap ?? structuredGap ?? 24;
      } else if (layoutModeForChildren === "column") {
        baseStyle.display ||= "flex";

        baseStyle.flexDirection ||= "column";

        baseStyle.gap ||= data.gap ?? structuredGap ?? 24;
      } else if (layoutModeForChildren === "grid") {
        const colCount = resolveColumnCount(data, children);

        baseStyle.display ||= "grid";

        if (layoutModeForChildren === "grid") {
          baseStyle.gridTemplateColumns ||= `repeat(${colCount}, 1fr)`;
        }

        baseStyle.gap ||= data.gap ?? structuredGap ?? 24;
      } else if (parentHasAbsolutePos) {
        baseStyle.position = "relative";

        baseStyle.width ||= "100%";

        if (heightHint) baseStyle.height ||= heightHint;
      }
      if (data.rowHeight) {
        baseStyle.minHeight ??= data.rowHeight;
        baseStyle.height ??= data.rowHeight;
      }
      break;
    }

    case "columns": {
      tag = "CanvasColumns";

      const cols = resolveColumnCount(data, children);
      baseStyle.display = "grid";
      baseStyle.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      baseStyle.gap = resolveColumnsGap(data, 0);
      baseStyle.position ||= parentHasAbsolutePos ? "relative" : baseStyle.position;
      baseStyle.width ||= "100%";
      if (heightHint) baseStyle.height ||= heightHint;

      break;
    }

    case "column":
      tag = "CanvasColumn";

      baseStyle.display = "flex";
      baseStyle.flexDirection = "column";
      baseStyle.gap = data.gap ?? structuredGap ?? 16;

      const cross = normalizeAxisToken(
        data.crossAxis ??
          data.alignItems ??
          data.crossAlignment ??
          data.columnCrossAxis
      );
      const main = normalizeAxisToken(
        data.mainAxis ??
          data.justifyContent ??
          data.mainAlignment ??
          data.columnMainAxis
      );

      if (cross === "center") baseStyle.alignItems = "center";
      else if (cross === "end" || cross === "right" || cross === "flex-end")
        baseStyle.alignItems = "flex-end";
      else if (cross === "stretch") baseStyle.alignItems = "stretch";
      else baseStyle.alignItems = "flex-start";

      if (main === "center") baseStyle.justifyContent = "center";
      else if (main === "end" || main === "right" || main === "flex-end")
        baseStyle.justifyContent = "flex-end";
      else if (main === "space-around") baseStyle.justifyContent = "space-around";
      else if (main === "space-evenly") baseStyle.justifyContent = "space-evenly";
      else if (main === "space-between") baseStyle.justifyContent = "space-between";
      else baseStyle.justifyContent = "flex-start";

      baseStyle.position ||= parentHasAbsolutePos ? "relative" : baseStyle.position;
      baseStyle.width ||= "100%";
      if (heightHint) baseStyle.height ||= heightHint;
      break;

    case "text":
      tag = headingForFontSize(Number(data.fontSize));
      content = data.text || "";
      baseStyle.color ||= data.color;
      baseStyle.fontSize ||= data.fontSize;
      baseStyle.fontWeight ||= data.fontWeight;
      baseStyle.lineHeight ||= data.lineHeight;
      baseStyle.textAlign ||= data.textAlign;

      if (shouldExportAsAbsolute) {
        baseStyle.position = "absolute";
        if (relativeX !== undefined) baseStyle.left = relativeX;
        if (relativeY !== undefined) baseStyle.top = relativeY;
        if (widthHint) baseStyle.width = widthHint;
        if (heightHint) baseStyle.height = heightHint;
      }
      break;

    case "button":
      tag = "CanvasButton";
      content = data.label || data.text || "Button";
      extraAttrs.href = data.href;
      baseStyle.backgroundColor ||= "#3b82f6";
      baseStyle.color ||= "#ffffff";
      baseStyle.border ||= "none";
      baseStyle.margin = "0";
      baseStyle.outline = "none";
      baseStyle.verticalAlign = "top";

      applyCornerRadius(baseStyle, data.borderRadius ?? data.radius ?? 8);
      baseStyle.padding ||= "12px 20px";
      baseStyle.fontWeight ||= 700;
      baseStyle.cursor = "pointer";

      baseStyle.userSelect = "none";

      if (shouldExportAsAbsolute) {
        baseStyle.position = "absolute";

        applyHorizontalPositioning(
          baseStyle,
          relativeX,
          originalLeft,
          originalRight,
          widthHint,
          frameWidth,
          node
        );

        if (relativeY !== undefined) baseStyle.top = relativeY;
        baseStyle.display = "block";
        if (widthHint) baseStyle.width = widthHint;
        if (heightHint) baseStyle.height = heightHint;
      } else {
        baseStyle.display = "inline-block";
      }
      break;

    case "formInput":
      tag = "CanvasFormInput";
      extraAttrs.label = data.label;
      extraAttrs.placeholder = data.placeholder ?? "Enter text...";
      extraAttrs.inputType = data.inputType ?? "text";
      extraAttrs.required = Boolean(data.required);
      break;

    case "formTextarea":
      tag = "CanvasFormTextarea";
      extraAttrs.label = data.label;
      extraAttrs.placeholder = data.placeholder ?? "Enter your message...";
      extraAttrs.required = Boolean(data.required);
      extraAttrs.rows = data.rows ?? 4;
      break;

    case "formCheckbox":
      tag = "CanvasFormCheckbox";
      extraAttrs.label = data.label ?? "Checkbox";
      extraAttrs.checked = Boolean(data.checked);
      extraAttrs.required = Boolean(data.required);
      break;

    case "formRadio":
      tag = "CanvasFormRadio";
      extraAttrs.label = data.label;
      extraAttrs.options = Array.isArray(data.options) ? data.options : [];
      extraAttrs.selectedValue = data.selectedValue ?? "";
      extraAttrs.required = Boolean(data.required);
      extraAttrs.groupName = data.groupName ?? "radio-group";
      extraAttrs.layout = data.layout === "horizontal" ? "horizontal" : "vertical";
      break;

    case "formSelect":
      tag = "CanvasFormSelect";
      extraAttrs.label = data.label;
      extraAttrs.placeholder = data.placeholder ?? "Select an option...";
      extraAttrs.options = Array.isArray(data.options) ? data.options : [];
      extraAttrs.selectedValue = data.selectedValue ?? "";
      extraAttrs.required = Boolean(data.required);
      break;

    case "start":
    case "ai":
    case "output":
      return "";

    case "image":
      tag = "img";
      isSelfClosing = true;
      imageSrc = data.src || "";
      imageAlt = data.alt || "";
      baseStyle.display ||= "block";
      if (widthHint) baseStyle.width = widthHint;
      if (heightHint) baseStyle.height = heightHint;
      if (shouldExportAsAbsolute) {
        baseStyle.position = "absolute";
        if (relativeX !== undefined) baseStyle.left = relativeX;
        if (relativeY !== undefined) baseStyle.top = relativeY;
      }
      break;

    case "spacer":
      tag = "div";
      baseStyle.minHeight ||= heightHint ?? data.height ?? 16;
      break;

    case "shape":
      if (data.semantic === false) return "";
      tag = "div";
      baseStyle.backgroundColor ||= data.backgroundColor ?? "#3b82f6";
      const shapeRadius = data.borderRadius ?? data.radius;
      if (shapeRadius !== undefined) {
        applyCornerRadius(baseStyle, shapeRadius);
      }
      if (
        parentCrossAxisStretch &&
        parentLayoutMode === "column" &&
        !shouldExportAsAbsolute
      ) {
        // Stretch flow shapes to the column width when cross-axis is stretch.
        baseStyle.width = "100%";
      } else if (widthHint) {
        baseStyle.width = widthHint;
      }
      if (heightHint) baseStyle.height = heightHint;
      if (shouldExportAsAbsolute) {
        baseStyle.position = "absolute";

        applyHorizontalPositioning(
          baseStyle,
          relativeX,
          originalLeft,
          originalRight,
          widthHint,
          frameWidth,
          node
        );

        if (relativeY !== undefined) baseStyle.top = relativeY;
      }
      break;

    default:
      tag = "div";

      if (layoutModeForChildren === "row") {
        baseStyle.display ||= "flex";
        baseStyle.flexDirection ||= "row";
        baseStyle.gap ||= data.gap ?? structuredGap ?? 12;
      } else if (layoutModeForChildren === "column") {
        baseStyle.display ||= "flex";
        baseStyle.flexDirection ||= "column";
        baseStyle.gap ||= data.gap ?? structuredGap ?? 12;
      } else if (layoutModeForChildren === "grid") {
        baseStyle.display ||= "grid";

        if (layoutModeForChildren === "grid") {
          baseStyle.gridTemplateColumns ||= `repeat(${resolveColumnCount(
            data,
            children
          )}, 1fr)`;
        }
        baseStyle.gap ||= data.gap ?? structuredGap ?? 12;
      } else {
        baseStyle.display ||= "flex";
        baseStyle.flexDirection ||= "column";
        baseStyle.gap ||= data.gap ?? 12;
      }
  }

  const isAbsoluteFrame =
    baseStyle.position === "relative" &&
    children.some((c) => {
      const s = c.node.style || {};
      return (
        s.position === "absolute" ||
        s.left !== undefined ||
        s.right !== undefined ||
        s.top !== undefined ||
        s.bottom !== undefined
      );
    });

  const preserveSemanticLayoutNode =
    node.type === "row" ||
    node.type === "columns" ||
    node.type === "column" ||
    node.type === "header" ||
    node.type === "footer";

  if (
    !isAbsoluteFrame &&
    layoutModeForChildren === "free" &&
    !preserveSemanticLayoutNode
  ) {
    stripLayoutPropsForFreeMode();
  }

  const indentStr = " ".repeat(indent);
  const extraAttr = attrsToPropString(extraAttrs);
  if (isSelfClosing) {
    return `${indentStr}<img${styleToPropString(
      baseStyle
    )}${extraAttr} src={${JSON.stringify(imageSrc)}} alt={${JSON.stringify(imageAlt)}} />`;
  }

  const effectiveFrameWidth =
    typeof baseStyle.width === "number"
      ? baseStyle.width
      : typeof widthHint === "number"
        ? widthHint
        : frameWidth;

  const childParentLayoutMode =
    node.type === "column"
      ? "column"
      : node.type === "columns"
        ? "grid"
        : layoutModeForChildren;
  const childParentCrossStretch =
    node.type === "column" && baseStyle.alignItems === "stretch";

  const childrenJSX = children
    .map((c) =>
      nodeToJSX(
        c as NormalizedTreeNode,
        indent + 2,
        childParentLayoutMode,
        baseStyle.position === "absolute",
        effectiveFrameWidth,
        styleCtx,
        { x: positionX ?? 0, y: positionY ?? 0 },
        { x: positionX ?? 0, y: positionY ?? 0 },
        childParentCrossStretch,
        options
      )
    )
    .filter(Boolean)
    .join("\n");

  // Safety: semantic column wrappers should have no implicit inter-column gap.
  if (
    (node.type === "row" ||
      node.type === "columns" ||
      node.type === "section" ||
      node.type === "container") &&
    children.some((c) => c.node.type === "column")
  ) {
    baseStyle.gap = 0;
    delete baseStyle.columnGap;
    delete baseStyle.rowGap;
  }

  // Convert style to Tailwind classes + inline fallback
  const { className, rest: inlineStyle } = styleToTailwind(baseStyle);
  const hasVisualStyle =
    Object.keys(inlineStyle).length > 0 ||
    /\b(bg-|border-|rounded-|shadow|p\[|m\[|w\[|h\[|min-|max-)/.test(className);
  const hasComponentProps = Object.keys(extraAttrs).length > 0;
  const preserveEmptyNode =
    node.type === "section" ||
    node.type === "container" ||
    node.type === "row" ||
    node.type === "columns" ||
    node.type === "column" ||
    node.type === "header" ||
    node.type === "footer" ||
    data.keepInExport === true;

  if (
    !childrenJSX &&
    !content &&
    !hasVisualStyle &&
    !hasComponentProps &&
    !preserveEmptyNode
  )
    return "";

  const classAttr = className ? ` className="${className}"` : "";
  const styleAttr = styleToPropString(inlineStyle);

  if (
    !childrenJSX &&
    !content &&
    !hasVisualStyle &&
    !hasComponentProps &&
    !preserveEmptyNode
  )
    return "";

  return `${indentStr}<${tag}${classAttr}${styleAttr}${extraAttr}>
${content ? indentStr + "  " + content : ""}
${childrenJSX ? "\n" + childrenJSX + "\n" + indentStr : ""}
</${tag}>`;
};

/* =========================
   Page Generator
========================= */

// Compose a Next.js page using normalized layout choices and deduped style tokens.
// All positioning is baked into markup/CSS to keep the exported app deterministic at runtime.
// Main/shell wrappers mirror the builder canvas bounds without re-running layout math in the client.
const generatePageTSX = (
  normalized: NormalizationResult,
  options: ExportOptions = {}
) => {
  const tree = normalized.normalizedNodes as NormalizedTreeNode[];

  const styleTokenMap = normalized.styleTokens.reduce<
    Record<string, StyleToken>
  >(
    (acc, token) => {
      acc[token.id] = token;

      return acc;
    },

    {}
  );

  const rootData = tree[0]?.node?.data || {};
  const rootStyle = tree[0]?.node?.style || {};

  const mainStyle: Record<string, any> = {
    background:
      rootData.backgroundColor ?? rootStyle.backgroundColor ?? "#000000",
    color: rootData.color ?? rootStyle.color ?? "#0f172a",
    width: "100%",
    minHeight: "100vh",
    display: "block",
    position: "relative",
  };

  const shellStyle: Record<string, any> = {
    width: "100%",
    maxWidth: "100%",
    position: "relative",
    margin: "0 auto",
    overflow: "visible",
  };

  const body =
    tree.length === 0
      ? "        <CanvasSection><p>Empty export</p></CanvasSection>"
      : tree
          .map((n) => {
            const frameWidth =
              rootData.width ?? rootData.frameWidth ?? rootStyle.width ?? 1280;

            // nodeToJSX consumes layout decisions + style tokens to decide structured vs absolute output.
            return nodeToJSX(
              n as NormalizedTreeNode,
              10,
              "free",
              false,
              frameWidth,
              { styleTokenMap, nodeStyleRef: normalized.nodeStyleRef },
              undefined,
              undefined,
              false,
              options
            );
          })
          .join("\n");

  const primitives = [
    "CanvasSection",
    body.includes("<CanvasButton") ? "CanvasButton" : "",
    body.includes("<CanvasColumn") ? "CanvasColumn" : "",
    body.includes("<CanvasColumns") ? "CanvasColumns" : "",
    body.includes("<CanvasFooter") ? "CanvasFooter" : "",
    body.includes("<CanvasFormCheckbox") ? "CanvasFormCheckbox" : "",
    body.includes("<CanvasFormInput") ? "CanvasFormInput" : "",
    body.includes("<CanvasFormRadio") ? "CanvasFormRadio" : "",
    body.includes("<CanvasFormSelect") ? "CanvasFormSelect" : "",
    body.includes("<CanvasFormTextarea") ? "CanvasFormTextarea" : "",
    body.includes("<CanvasHeader") ? "CanvasHeader" : "",
    body.includes("<CanvasRow") ? "CanvasRow" : "",
  ].filter(Boolean);

  const primitiveImports = primitives
    .map((name) => `import { ${name} } from "../components/${name}";`)
    .join("\n");

  return `${primitiveImports}

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-black text-slate-900" ${styleToPropString(mainStyle)}>
      <script src="https://cdn.tailwindcss.com"></script>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: ${JSON.stringify(
        GLOBAL_EXPORT_CSS
      )} }} />
      <CanvasSection className="w-full max-w-full relative mx-auto overflow-visible"${styleToPropString(shellStyle)}>
${body}
      </CanvasSection>
    </main>
  );
}
`;
};

/* =========================
   ZIP EXPORT
========================= */

// Export pipeline: copy the scaffold, normalize the active page, emit static page.tsx, then download.
// Keeps builder-only state out of the bundle so the exported app never reruns layout heuristics.
// Relies on the normalization stage for deterministic HTML/CSS across repeated exports.
export async function exportNextJSZip(
  site: SiteSchema,
  diagnosticsOverride?: NormalizationResult["diagnostics"],
  options: ExportOptions = {}
) {
  const zip = new JSZip();

  const scaffold = import.meta.glob(
    "../../public/export-nextjs/{package.json,next.config.mjs,tsconfig.json,next-env.d.ts,app/layout.tsx,app/globals.css}",
    { query: "?raw", import: "default", eager: true }
  ) as Record<string, string>;

  const expected = [
    "package.json",
    "next.config.mjs",
    "tsconfig.json",
    "next-env.d.ts",
    "app/layout.tsx",
    "app/globals.css",
  ];

  const missing = expected.filter(
    (f) => !Object.keys(scaffold).some((k) => k.endsWith(`export-nextjs/${f}`))
  );

  if (missing.length) {
    throw new Error(`Export scaffold missing: ${missing.join(", ")}`);
  }

  Object.entries(scaffold).forEach(([path, content]) => {
    const rel = path.slice(path.indexOf("export-nextjs/"));
    zip.file(rel, content);
  });

  const page =
    site.pages.find((p) => p.id === site.activePageId) || site.pages[0];

  // Stage 2 normalize before generating JSX so we can honor safe layouts and shared styles.
  const tree = page ? buildTree(page.nodes || []) : [];
  const normalized = normalizeTree(tree);

  zip.file(
    "export-nextjs/export-diagnostics.json",
    JSON.stringify(diagnosticsOverride ?? normalized.diagnostics, null, 2)
  );

  const componentFiles = generateExportComponentFiles();
  Object.entries(componentFiles).forEach(([fileName, content]) => {
    zip.file(`export-nextjs/components/${fileName}`, content);
  });

  zip.file("export-nextjs/app/page.tsx", generatePageTSX(normalized, options));

  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "codeflow-nextjs-export.zip";
  a.click();
  URL.revokeObjectURL(a.href);
}
