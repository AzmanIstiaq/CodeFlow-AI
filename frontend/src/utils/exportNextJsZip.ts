import JSZip from "jszip";

/* =========================
   Types
========================= */

type SiteSchema = {
  pages: Array<{
    id: string;
    name: string;
    nodes: any[];
    edges: any[];
  }>;
  activePageId: string;
};

type TreeNode = {
  node: any;
  children: TreeNode[];
};

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

const calculateChildrenBounds = (nodes: any[]) => {
  if (nodes.length === 0) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  nodes.forEach((n) => {
    const x = n.position?.x ?? 0;
    const y = n.position?.y ?? 0;
    const w = n.style?.width ?? n.data?.width ?? 100;
    const h = n.style?.height ?? n.data?.height ?? 100;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });

  return minX === Infinity
    ? null
    : {
        width: maxX - minX,
        height: maxY - minY,
        offsetX: minX,
        offsetY: minY,
      };
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

  nodes.forEach((n) => {
    const pid = n.parentNode;
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

/* =========================
   Core JSX Generator
========================= */

const applyHorizontalPositioning = (baseStyle: any, positionX: number | undefined, originalLeft: any, originalRight: any, widthHint: number | undefined, frameWidth?: number, node?: any) => {
  // If original right/left exists, use them
  if (originalRight !== undefined) {
    baseStyle.right = originalRight;
    delete baseStyle.left;
  } else if (originalLeft !== undefined) {
    baseStyle.left = originalLeft;
    delete baseStyle.right;
  } else if (positionX !== undefined && frameWidth && widthHint) {
    // Calculate distances: left edge vs right edge
    const distanceFromLeft = positionX;
    const distanceFromRight = frameWidth - (positionX + widthHint);
    
    // Debug logging for buttons and shapes
    if (node.type === 'button' || node.type === 'shape') {
      console.log(`Positioning analysis for ${node.type} (${node.id}):`, {
        positionX,
        widthHint,
        frameWidth,
        distanceFromLeft,
        distanceFromRight,
        useRight: distanceFromRight < distanceFromLeft,
        comparison: `${distanceFromRight} < ${distanceFromLeft} = ${distanceFromRight < distanceFromLeft}`
      });
    }
    
    // Use whichever edge is closer
    if (distanceFromRight < distanceFromLeft) {
      baseStyle.right = distanceFromRight;
      delete baseStyle.left;
    } else {
      baseStyle.left = positionX;
      delete baseStyle.right;
    }
  } else if (positionX !== undefined && frameWidth && node.type === 'button') {
    // For buttons without explicit width, estimate based on text content
    const text = node.data?.label || node.data?.text || 'Button';
    const estimatedWidth = Math.max(80, text.length * 8 + 40); // Rough estimate
    const distanceFromLeft = positionX;
    const distanceFromRight = frameWidth - (positionX + estimatedWidth);
    
    console.log(`Button positioning analysis (estimated width):`, {
      nodeId: node.id,
      positionX,
      estimatedWidth,
      frameWidth,
      distanceFromLeft,
      distanceFromRight,
      useRight: distanceFromRight < distanceFromLeft,
      comparison: `${distanceFromRight} < ${distanceFromLeft} = ${distanceFromRight < distanceFromLeft}`
    });
    
    if (distanceFromRight < distanceFromLeft) {
      baseStyle.right = distanceFromRight;
      delete baseStyle.left;
    } else {
      baseStyle.left = positionX;
      delete baseStyle.right;
    }
  } else if (positionX !== undefined) {
    baseStyle.left = positionX;
    delete baseStyle.right;
  }
};

const applyVerticalPositioning = (baseStyle: any, positionY: number | undefined, originalTop: any, originalBottom: any) => {
  // If original top/bottom exists, use them
  if (originalBottom !== undefined) {
    baseStyle.bottom = originalBottom;
    delete baseStyle.top;
  } else if (originalTop !== undefined) {
    baseStyle.top = originalTop;
    delete baseStyle.bottom;
  } else if (positionY !== undefined) {
    baseStyle.top = positionY;
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

const nodeToJSX = (
  tree: TreeNode,
  indent = 6,
  parentType?: string,
  parentHasAbsolutePos?: boolean,
  frameWidth?: number
): string => {
  const { node, children } = tree;
  const data = node.data || {};
  const baseStyle: Record<string, any> = {
    ...(node.style || {}),
    ...(data.style || {}),
  };

  // Capture original positioning values before deletion
  const originalRight = baseStyle.right;
  const originalLeft = baseStyle.left;
  const originalBottom = baseStyle.bottom;
  const originalTop = baseStyle.top;

  // We'll preserve right/bottom positioning - don't delete them yet

  // Capture dimensional hints before stripping canvas geometry.
  const widthHint = baseStyle.width ?? data.width;
  const heightHint = baseStyle.height ?? data.height;

  const positionX = node.position?.x;
  const positionY = node.position?.y;

  // Check if THIS node is absolutely positioned in canvas
  const hasAbsolutePosition =
    node.position?.x !== undefined ||
    node.position?.y !== undefined ||
    baseStyle.position === "absolute" ||
    baseStyle.left !== undefined ||
    baseStyle.top !== undefined;

  // Remove canvas positioning only if in structured layouts (rows/columns)
  const inStructuredLayout =
    parentType === "row" || parentType === "columns" || parentType === "column";

  // Handle positioning - export coordinates exactly as-is, no offset subtraction
  if (inStructuredLayout && !parentHasAbsolutePos) {
    // In structured layouts (not inside absolute parents), remove position
    delete baseStyle.position;
    delete baseStyle.left;
    delete baseStyle.top;
    delete baseStyle.right;
    delete baseStyle.bottom;
    delete baseStyle.x;
    delete baseStyle.y;
  } else if (hasAbsolutePosition) {
    // Absolutely positioned - preserve original positioning (left/right/top/bottom)
    baseStyle.position = "absolute";
    
    // Apply horizontal positioning with right/left detection
    applyHorizontalPositioning(baseStyle, positionX, originalLeft, originalRight, widthHint, frameWidth, node);
    
    // Apply vertical positioning with top/bottom detection  
    applyVerticalPositioning(baseStyle, positionY, originalTop, originalBottom);
  } else {
    // Default: remove positioning
    delete baseStyle.position;
    delete baseStyle.left;
    delete baseStyle.top;
    delete baseStyle.right;
    delete baseStyle.bottom;
    delete baseStyle.x;
    delete baseStyle.y;
  }

  delete baseStyle.zIndex;
  delete baseStyle.transform;
  // Only delete width/height if not absolutely positioned
  if (baseStyle.position !== "absolute") {
    delete baseStyle.width;
    delete baseStyle.height;
    delete baseStyle.left;
    delete baseStyle.top;
  }

  let tag = "div";
  let content = "";

  switch (node.type) {
    case "page":
    case "frame":
      tag = "section";
      baseStyle.position = "relative";
      // Only use flex if this frame doesn't contain only absolutely positioned children
      baseStyle.display ||= "flex";
      baseStyle.flexDirection ||= "column";
      baseStyle.gap ||= data.gap ?? 32;
      baseStyle.margin ||= "0 auto";
      if (widthHint) baseStyle.width = widthHint;
      if (heightHint) baseStyle.minHeight = heightHint;
      if (data.backgroundColor)
        baseStyle.backgroundColor ||= data.backgroundColor;
      break;

    case "section":
    case "container":
      tag = "section";
      baseStyle.display ||= "flex";
      baseStyle.flexDirection ||= "column";
      baseStyle.gap ||= data.gap ?? 16;
      baseStyle.backgroundColor ||= data.backgroundColor ?? "transparent";
      applyCornerRadius(baseStyle, data.borderRadius ?? data.radius);
      // Only set absolute position on section itself if it's a direct canvas child
      if (hasAbsolutePosition && !inStructuredLayout && !parentHasAbsolutePos) {
        baseStyle.position = "absolute";
        if (widthHint) baseStyle.width = widthHint;
        if (heightHint) baseStyle.height = heightHint;
      } else if (!inStructuredLayout && !hasAbsolutePosition) {
        baseStyle.position = "relative";
      }
      // When this section is absolute and contains absolute children,
      // When this section is absolute and contains absolute children,
      // switch from flex to relative positioning so children can use absolute positioning
      if (
        hasAbsolutePosition &&
        children.some((c) => {
          return (
            c.node.position?.x !== undefined || c.node.position?.y !== undefined
          );
        })
      ) {
        const bounds = calculateChildrenBounds(children.map((c) => c.node));
        if (bounds) {
          baseStyle.position = "relative";
          baseStyle.display = "block";
          baseStyle.width = "100%";
          // Set minimum height to contain absolutely positioned children
          baseStyle.minHeight = bounds.height;
          delete baseStyle.flexDirection;
          delete baseStyle.gap;
          delete baseStyle.left;
          delete baseStyle.top;
        }
      }
      break;

    case "row": {
      tag = "div";
      // If parent is absolutely positioned, don't use grid - keep relative with absolute children
      if (parentHasAbsolutePos) {
        baseStyle.position = "relative";
        baseStyle.width = "100%";
        if (heightHint) baseStyle.height = heightHint;
      } else {
        const colCount = resolveColumnCount(data, children);
        baseStyle.display = "grid";
        baseStyle.gridTemplateColumns = `repeat(${colCount}, 1fr)`;
        baseStyle.gap ||= data.gap ?? 24;
        if (heightHint) baseStyle.minHeight ||= heightHint;
      }
      break;
    }

    case "columns": {
      tag = "div";
      // If parent is absolutely positioned, don't use grid - keep relative with absolute children
      if (parentHasAbsolutePos) {
        baseStyle.position = "relative";
        baseStyle.width = "100%";
        if (heightHint) baseStyle.height = heightHint;
      } else {
        const cols = resolveColumnCount(data, children);
        baseStyle.display = "grid";
        baseStyle.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        baseStyle.gap ||= data.gap ?? 24;
      }
      break;
    }

    case "column":
      tag = "div";
      // If parent is absolutely positioned, don't use flex - keep relative with absolute children
      if (parentHasAbsolutePos) {
        baseStyle.position = "relative";
        baseStyle.width = "100%";
      } else {
        baseStyle.display = "flex";
        baseStyle.flexDirection = "column";
        baseStyle.gap ||= data.gap ?? 16;
        if (widthHint) baseStyle.maxWidth ||= widthHint;
      }
      break;

    case "text":
      tag = headingForFontSize(Number(data.fontSize));
      content = data.text || "";
      baseStyle.color ||= data.color;
      baseStyle.fontSize ||= data.fontSize;
      baseStyle.fontWeight ||= data.fontWeight;
      baseStyle.lineHeight ||= data.lineHeight;
      baseStyle.textAlign ||= data.textAlign;
      // Text should be absolutely positioned if it has position data
      if (hasAbsolutePosition) {
        baseStyle.position = "absolute";
        if (positionX !== undefined) baseStyle.left = positionX;
        if (positionY !== undefined) baseStyle.top = positionY;
        if (widthHint) baseStyle.width = widthHint;
        if (heightHint) baseStyle.height = heightHint;
      }
      break;

    case "button":
      tag = "button";
      content = data.label || data.text || "Button";
      baseStyle.backgroundColor ||= "#3b82f6";
      baseStyle.color ||= "#ffffff";
      baseStyle.border ||= "none";
      baseStyle.margin = "0"; // Remove default button margin
      baseStyle.outline = "none"; // Remove focus outline
      baseStyle.verticalAlign = "top"; // Prevent baseline alignment gaps
      applyCornerRadius(baseStyle, data.borderRadius ?? data.radius ?? 8);
      baseStyle.padding ||= "12px 20px";
      baseStyle.fontWeight ||= 700;
      baseStyle.cursor = "pointer";
      baseStyle.userSelect = "none"; // Prevent text selection
      // Buttons should be absolutely positioned if they have position data
      if (hasAbsolutePosition) {
        baseStyle.position = "absolute";
        // Apply the same right/left logic for buttons
        applyHorizontalPositioning(baseStyle, positionX, originalLeft, originalRight, widthHint, frameWidth, node);
        if (positionY !== undefined) baseStyle.top = positionY;
        baseStyle.display = "block";
        if (widthHint) baseStyle.width = widthHint;
        if (heightHint) baseStyle.height = heightHint;
      } else {
        baseStyle.display = "inline-block";
      }
      break;

    case "image":
      tag = "img";
      baseStyle.display ||= "block";
      if (widthHint) baseStyle.width = widthHint;
      if (heightHint) baseStyle.height = heightHint;
      if (hasAbsolutePosition) {
        baseStyle.position = "absolute";
        if (positionX !== undefined) baseStyle.left = positionX;
        if (positionY !== undefined) baseStyle.top = positionY;
      }
      return `${" ".repeat(indent)}<img${styleToPropString(
        baseStyle
      )} src={${JSON.stringify(data.src || "")}} alt={${JSON.stringify(
        data.alt || ""
      )}} />`;

    case "spacer":
      tag = "div";
      baseStyle.minHeight ||= heightHint ?? data.height ?? 16;
      break;

    case "shape":
      if (data.semantic === false) return "";
      tag = "div";
      baseStyle.backgroundColor ||= data.backgroundColor ?? "#3b82f6";
      // Preserve exact border radius: per-corner or uniform, never infer
      const shapeRadius = data.borderRadius ?? data.radius;
      if (shapeRadius !== undefined) {
        applyCornerRadius(baseStyle, shapeRadius);
      }
      if (widthHint) baseStyle.width = widthHint;
      if (heightHint) baseStyle.height = heightHint;
      // Shapes should always be absolutely positioned if they have position data
      if (hasAbsolutePosition) {
        baseStyle.position = "absolute";
        // Apply the same right/left logic for shapes
        applyHorizontalPositioning(baseStyle, positionX, originalLeft, originalRight, widthHint, frameWidth, node);
        if (positionY !== undefined) baseStyle.top = positionY;
      }
      break;

    default:
      tag = "div";
      baseStyle.display ||= "flex";
      baseStyle.flexDirection ||= "column";
      baseStyle.gap ||= data.gap ?? 12;
  }

  const indentStr = " ".repeat(indent);
  const childrenJSX = children
    .map((c) =>
      nodeToJSX(c, indent + 2, node.type, hasAbsolutePosition, frameWidth)
    )
    .filter(Boolean)
    .join("\n");

  const hasVisualStyle = Object.keys(baseStyle).length > 0;

  if (!childrenJSX && !content && !hasVisualStyle) return "";

  return `${indentStr}<${tag}${styleToPropString(baseStyle)}>
${content ? indentStr + "  " + content : ""}
${childrenJSX ? "\n" + childrenJSX + "\n" + indentStr : ""}
</${tag}>`;
};

/* =========================
   Page Generator
========================= */

const generatePageTSX = (tree: TreeNode[]) => {
  const globalCss = `
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif; }
`;

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
    maxWidth: rootData.width ?? rootData.frameWidth ?? rootStyle.width,
    position: "relative",
    margin: "0 auto",
    overflow: "visible",
  };

  const body =
    tree.length === 0
      ? "        <section><p>Empty export</p></section>"
      : tree.map((n) => {
          const frameWidth = rootData.width ?? rootData.frameWidth ?? rootStyle.width ?? 1280;
          return nodeToJSX(n, 10, undefined, false, frameWidth);
        }).join("\n");

  return `export default function Page() {
  return (
    <main${styleToPropString(mainStyle)}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: ${JSON.stringify(
        globalCss
      )} }} />
      <section${styleToPropString(shellStyle)}>
${body}
      </section>
    </main>
  );
}
`;
};

/* =========================
   ZIP EXPORT
========================= */

export async function exportNextJSZip(site: SiteSchema) {
  const zip = new JSZip();

  const scaffold = import.meta.glob(
    "../../public/export-nextjs/{package.json,next.config.mjs,tsconfig.json,next-env.d.ts,app/layout.tsx,app/globals.css}",
    { query: "?raw", import: "default", eager: true }
  ) as Record<string, string>;

  Object.entries(scaffold).forEach(([path, content]) => {
    const rel = path.slice(path.indexOf("export-nextjs/"));
    zip.file(rel, content);
  });

  const page =
    site.pages.find((p) => p.id === site.activePageId) || site.pages[0];

  const tree = page ? buildTree(page.nodes || []) : [];
  zip.file("export-nextjs/app/page.tsx", generatePageTSX(tree));

  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "codeflow-nextjs-export.zip";
  a.click();
  URL.revokeObjectURL(a.href);
}
