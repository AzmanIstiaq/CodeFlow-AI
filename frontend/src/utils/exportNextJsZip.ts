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

const styleValue = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return JSON.stringify(value);
  return null;
};

const styleToPropString = (style: Record<string, any>) => {
  const entries = Object.entries(style).reduce<string[]>((acc, [key, value]) => {
    const formatted = styleValue(value);
    if (formatted !== null) acc.push(`${key}: ${formatted}`);
    return acc;
  }, []);
  return entries.length ? ` style={{ ${entries.join(", ")} }}` : "";
};

const applyCornerRadius = (target: Record<string, any>, radius: any) => {
  if (radius === undefined || radius === null) return;
  if (typeof radius === "number") {
    target.borderRadius = radius;
    return;
  }
  if (typeof radius === "object") {
    const { tl, tr, br, bl, topLeft, topRight, bottomRight, bottomLeft } =
      radius as any;
    const r1 = tl ?? topLeft ?? 0;
    const r2 = tr ?? topRight ?? 0;
    const r3 = br ?? bottomRight ?? 0;
    const r4 = bl ?? bottomLeft ?? 0;
    if (r1 === r2 && r1 === r3 && r1 === r4) {
      target.borderRadius = r1;
    } else {
      target.borderTopLeftRadius = r1;
      target.borderTopRightRadius = r2;
      target.borderBottomRightRadius = r3;
      target.borderBottomLeftRadius = r4;
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

const nodeToJSX = (tree: TreeNode, indent = 6): string => {
  const { node, children } = tree;
  const data = node.data || {};
  const baseStyle: Record<string, any> = {
    ...(node.style || {}),
    ...(data.style || {}),
  };

  // Capture dimensional hints before stripping canvas geometry.
  const widthHint = baseStyle.width ?? data.width;
  const heightHint = baseStyle.height ?? data.height;

  // Remove canvas positioning; exported layout must rely on semantic flow.
  delete baseStyle.position;
  delete baseStyle.left;
  delete baseStyle.top;
  delete baseStyle.right;
  delete baseStyle.bottom;
  delete baseStyle.x;
  delete baseStyle.y;
  delete baseStyle.zIndex;
  delete baseStyle.transform;
  delete baseStyle.width;
  delete baseStyle.height;

  let tag = "div";
  let content = "";

  switch (node.type) {
    case "page":
    case "frame":
      tag = "section";
      baseStyle.display ||= "flex";
      baseStyle.flexDirection ||= "column";
      baseStyle.gap ||= data.gap ?? 32;
      baseStyle.margin ||= "0 auto";
      if (widthHint) baseStyle.maxWidth ||= widthHint;
      if (data.backgroundColor) baseStyle.backgroundColor ||= data.backgroundColor;
      break;

    case "section":
    case "container":
      tag = "section";
      baseStyle.display ||= "flex";
      baseStyle.flexDirection ||= "column";
      baseStyle.gap ||= data.gap ?? 16;
      baseStyle.padding ||= data.padding ?? 24;
      baseStyle.backgroundColor ||= data.backgroundColor ?? "transparent";
      applyCornerRadius(baseStyle, data.borderRadius ?? data.radius);
      break;

    case "row": {
      tag = "div";
      const colCount = data.columns ?? children.length ?? 1;
      baseStyle.display = "grid";
      baseStyle.gridTemplateColumns = `repeat(${colCount}, 1fr)`;
      baseStyle.gap ||= data.gap ?? 24;
      if (heightHint) baseStyle.minHeight ||= heightHint;
      break;
    }

    case "columns": {
      tag = "div";
      baseStyle.display = "grid";
      const cols = data.columns?.count ?? data.count ?? children.length ?? 1;
      baseStyle.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      baseStyle.gap ||= data.gap ?? 24;
      break;
    }

    case "column":
      tag = "div";
      baseStyle.display = "flex";
      baseStyle.flexDirection = "column";
      baseStyle.gap ||= data.gap ?? 16;
      if (widthHint) baseStyle.maxWidth ||= widthHint;
      break;

    case "text":
      tag = headingForFontSize(Number(data.fontSize));
      content = data.text || "";
      baseStyle.color ||= data.color;
      baseStyle.fontSize ||= data.fontSize;
      baseStyle.fontWeight ||= data.fontWeight;
      baseStyle.lineHeight ||= data.lineHeight;
      baseStyle.textAlign ||= data.textAlign;
      break;

    case "button":
      tag = "button";
      content = data.label || data.text || "Button";
      baseStyle.backgroundColor ||= "#3b82f6";
      baseStyle.color ||= "#ffffff";
      baseStyle.border ||= "none";
      applyCornerRadius(baseStyle, data.borderRadius ?? data.radius ?? 8);
      baseStyle.padding ||= "12px 20px";
      baseStyle.fontWeight ||= 700;
      break;

    case "image":
      tag = "img";
      baseStyle.display ||= "block";
      if (widthHint) baseStyle.maxWidth ||= widthHint;
      if (heightHint) baseStyle.height ||= heightHint;
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
      tag = "div";
      baseStyle.backgroundColor ||= data.backgroundColor ?? "#3b82f6";
      applyCornerRadius(baseStyle, data.borderRadius ?? data.radius ?? 9999);
      if (widthHint) baseStyle.width ||= widthHint;
      if (heightHint) baseStyle.height ||= heightHint;
      break;

    default:
      tag = "div";
      baseStyle.display ||= "flex";
      baseStyle.flexDirection ||= "column";
      baseStyle.gap ||= data.gap ?? 12;
  }

  const indentStr = " ".repeat(indent);
  const childrenJSX = children
    .map((c) => nodeToJSX(c, indent + 2))
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
  const mainStyle: Record<string, any> = {
    background: rootData.backgroundColor ?? "#000000",
    color: rootData.color ?? "#0f172a",
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: rootData.padding ?? 32,
  };

  const shellStyle: Record<string, any> = {
    width: "100%",
    maxWidth: rootData.width ?? rootData.frameWidth ?? 1280,
    display: "flex",
    flexDirection: "column",
    gap: rootData.gap ?? 24,
    margin: "0 auto",
  };

  const body =
    tree.length === 0
      ? "        <section><p>Empty export</p></section>"
      : tree.map((n) => nodeToJSX(n, 10)).join("\n");

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
    { as: "raw", eager: true }
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
