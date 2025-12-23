import type { TreeNode } from "./buildTree";

/**
 * Check if a node type should be included in HTML export (builder mode)
 */
function isBuilderNode(type: string): boolean {
  return (
    type === "text" ||
    type === "section" ||
    type === "columnsSection" ||
    type === "button"
  ); // Add more builder node types here (image, etc.)
}

/**
 * Filters out workflow-only nodes from the tree
 */
function filterBuilderNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .filter((n) => n.type && isBuilderNode(n.type))
    .map((n) => ({
      ...n,
      children: n.children?.length ? filterBuilderNodes(n.children) : [],
    }));
}

/**
 * Renders a single node to HTML based on its type and data
 */
function renderNode(node: TreeNode): string {
  switch (node.type) {
    case "text":
      const text = node.data.text || "Sample Text";
      const fontSize = node.data.fontSize || 14;
      const color = node.data.color || "#000000";
      return `<div style="font-size:${fontSize}px;color:${color};">${text}</div>`;

    case "section":
      const padding = node.data.padding || 40;
      const bgColor = node.data.backgroundColor || "#111111";
      const secMaxWidth = node.data.maxWidth || 960;
      return `<section style="padding:${padding}px;background:${bgColor};">
  <div style="max-width:${secMaxWidth}px;margin:0 auto;">`;

    case "columnsSection":
      const colPadding = node.data.padding || 32;
      const colBgColor = node.data.backgroundColor || "#000000";
      const maxWidth = node.data.maxWidth || 960;
      const columns = node.data.columns || 2;
      const gap = node.data.gap || 24;
      const align = node.data.align || "start";
      const justifyItems = align === "center" ? "center" : "start";

      return `<section style="padding:${colPadding}px;background:${colBgColor};">
  <div style="max-width:${maxWidth}px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:repeat(${columns}, 1fr);gap:${gap}px;justify-items:${justifyItems};">`;

    case "button":
      const label = node.data.label || "Click Me";
      const href = node.data.href || "#";
      return `<a href="${href}" style="display:inline-block;padding:10px 16px;border-radius:6px;text-decoration:none;background:${
        node.data.variant === "secondary" ? "#374151" : "#3b82f6"
      };color:#ffffff;font-weight:500;">${label}</a>`;

    default:
      return "";
  }
}

/**
 * Recursively renders a tree of nodes to HTML
 */
function renderTree(nodes: TreeNode[], allNodes: TreeNode[] = []): string {
  return nodes
    .map((n) => {
      const nodeContent = renderNode(n);
      const children = n.children?.length
        ? renderTree(n.children, allNodes)
        : "";

      // Section wraps its children inside container
      if (n.type === "section") {
        return `${nodeContent}
    ${children}
  </div>
</section>`;
      }

      // ColumnsSection renders columns with their children from data.children
      if (n.type === "columnsSection") {
        const columnCount = n.data.columns || 2;
        const childrenMap = n.data.children || {};

        // Check if any column has children
        const hasChildren = Object.values(childrenMap).some(
          (col: any) => col && col.length > 0
        );

        // Skip empty columns sections
        if (!hasChildren) return "";

        // Render each column with its children
        const columnsHtml = Array.from({ length: columnCount })
          .map((_, colIndex) => {
            const columnChildIds = childrenMap[colIndex] || [];
            const columnChildren = columnChildIds
              .map((nodeId: string) => {
                const childNode = allNodes.find((node) => node.id === nodeId);
                return childNode ? renderNode(childNode) : "";
              })
              .filter(Boolean)
              .join("\n        ");

            return `
      <div>
        ${columnChildren}
      </div>`;
          })
          .join("");

        return `${nodeContent}${columnsHtml}
    </div>
  </div>
</section>`;
      }

      // If node has children, wrap in a container div
      if (children) {
        return `<div>
  ${nodeContent}
  ${children}
</div>`;
      }

      return nodeContent;
    })
    .filter(Boolean) // Remove empty strings
    .join("\n");
}

/**
 * Exports a tree of nodes to a complete HTML document
 *
 * @param tree - Array of root TreeNodes with nested children
 * @param allNodes - All nodes in the page (for resolving column children)
 * @returns Complete HTML document as a string
 */
export function exportHTML(tree: TreeNode[], allNodes?: TreeNode[]): string {
  // Filter to only include builder nodes (exclude workflow nodes)
  const filteredTree = filterBuilderNodes(tree);
  const bodyContent = renderTree(filteredTree, allNodes || filteredTree);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
    }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}
