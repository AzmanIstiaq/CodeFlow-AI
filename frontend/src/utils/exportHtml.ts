import type { TreeNode } from "./buildTree";

/**
 * Check if a node type should be included in HTML export (builder mode)
 */
function isBuilderNode(type: string): boolean {
  return type === "text" || type === "section"; // Add more builder node types here (button, image, etc.)
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
      return `<section style="padding:${padding}px;background:${bgColor};">`;

    default:
      return "";
  }
}

/**
 * Recursively renders a tree of nodes to HTML
 */
function renderTree(nodes: TreeNode[]): string {
  return nodes
    .map((n) => {
      const nodeContent = renderNode(n);
      const children = n.children?.length ? renderTree(n.children) : "";

      // Section wraps its children inside
      if (n.type === "section") {
        return `${nodeContent}
  ${children}
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
    .join("\n");
}

/**
 * Exports a tree of nodes to a complete HTML document
 *
 * @param tree - Array of root TreeNodes with nested children
 * @returns Complete HTML document as a string
 */
export function exportHTML(tree: TreeNode[]): string {
  // Filter to only include builder nodes (exclude workflow nodes)
  const filteredTree = filterBuilderNodes(tree);
  const bodyContent = renderTree(filteredTree);

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
