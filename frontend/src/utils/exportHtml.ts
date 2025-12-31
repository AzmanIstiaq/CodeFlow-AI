import type { TreeNode } from "./buildTree";

/**
 * Check if a node type should be included in HTML export (builder mode)
 */
function isBuilderNode(type: string): boolean {
  return (
    type === "text" ||
    type === "section" ||
    type === "columnsSection" ||
    type === "button" ||
    type === "image" ||
    type === "container" ||
    type === "shape" ||
    type === "formInput" ||
    type === "formTextarea"
  );
}

/**
 * Filters out workflow-only nodes from the tree and removes column children from root
 */
function filterBuilderNodes(nodes: TreeNode[], allNodes: TreeNode[] = []): TreeNode[] {
  return nodes
    .filter((n) => {
      // Filter out workflow nodes
      if (!n.type || !isBuilderNode(n.type)) return false;
      
      // Filter out nodes that are owned by a column (they'll be rendered inside their column)
      if (n.data?._ownedByColumn) return false;
      
      return true;
    })
    .map((n) => ({
      ...n,
      children: n.children?.length ? filterBuilderNodes(n.children, allNodes) : [],
    }));
}

/**
 * Renders a single node to HTML based on its type and data
 */
function renderNode(node: TreeNode): string {
  switch (node.type) {
    case "text":
      const text = node.data.text || "Sample Text";
      const fontSize = node.data.fontSize || 16;
      const color = node.data.color || "#000000";
      const fontWeight = node.data.fontWeight || 400;
      const fontFamily = node.data.fontFamily || "inherit";
      const textAlign = node.data.textAlign || "left";
      const lineHeight = node.data.lineHeight || 1.6;
      const letterSpacing = node.data.letterSpacing || 0;
      const textDecoration = node.data.textDecoration || "none";
      const textLink = node.data.link || "";
      const opacity = node.data.opacity ?? 1;
      const rotation = node.data.rotation || 0;
      const textShadow = node.data.textShadow || "none";
      const textBgColor = node.data.backgroundColor || "transparent";
      const textPadding = node.data.padding || 16;
      const borderRadius = node.data.borderRadius || 0;
      const border = node.data.border || "none";
      const width = node.data.width || "auto";
      
      const textStyle = `font-size:${fontSize}px;color:${color};font-weight:${fontWeight};font-family:${fontFamily};text-align:${textAlign};line-height:${lineHeight};letter-spacing:${letterSpacing}px;text-decoration:${textDecoration};padding:${textPadding}px;min-height:44px;display:flex;align-items:center;opacity:${opacity};transform:rotate(${rotation}deg);text-shadow:${textShadow};background-color:${textBgColor};border-radius:${borderRadius}px;border:${border};width:${width}px;`;
      
      if (textLink) {
        return `<div style="${textStyle}"><a href="${textLink}" style="color:inherit;text-decoration:inherit;">${text}</a></div>`;
      }
      return `<div style="${textStyle}">${text}</div>`;

    case "section":
      const secPadding = node.data.padding || 0;
      const secBgColor = node.data.backgroundColor || "transparent";
      const secBgImage = node.data.backgroundImage || "";
      const secBgSize = node.data.backgroundSize || "cover";
      const secBgPosition = node.data.backgroundPosition || "center";
      const hasColumns = node.data.columns && node.data.columns.count > 0;
      
      const bgImageStyle = secBgImage ? `background-image:url(${secBgImage});background-size:${secBgSize};background-position:${secBgPosition};background-repeat:no-repeat;` : "";
      
      if (hasColumns) {
        // Section with absolute positioned children
        return `<section style="padding:${secPadding}px;background-color:${secBgColor};${bgImageStyle}width:100%;min-height:100vh;position:relative;">
  <div style="position:relative;width:100%;height:100%;">`;
      } else {
        return `<section style="padding:${secPadding}px;background-color:${secBgColor};${bgImageStyle}width:100%;min-height:100vh;display:flex;justify-content:center;align-items:center;">
  <div style="width:100%;">`;
      };

    case "columnsSection":
      const colPadding = node.data.padding || 0;
      const colBgColor = node.data.backgroundColor || "transparent";
      const colBgImage = node.data.backgroundImage || "";
      const colBgSize = node.data.backgroundSize || "cover";
      const colBgPosition = node.data.backgroundPosition || "center";
      const maxWidth = node.data.maxWidth || 1280;
      const columns = node.data.columns?.count || 2;
      const gap = node.data.columns?.gap || 0;
      const align = node.data.align || "start";
      const justifyItems = align === "center" ? "center" : "start";
      
      const colBgImageStyle = colBgImage ? `background-image:url(${colBgImage});background-size:${colBgSize};background-position:${colBgPosition};background-repeat:no-repeat;` : "";

      return `<section style="padding:${colPadding}px;background-color:${colBgColor};${colBgImageStyle}width:100%;min-height:100vh;display:flex;justify-content:center;align-items:center;">
  <div style="max-width:${maxWidth}px;width:100%;">
    <div style="display:grid;grid-template-columns:repeat(${columns}, 1fr);gap:${gap}px;justify-items:${justifyItems};padding:40px 32px;">`;

    case "button":
      const label = node.data.label || "Click Me";
      const href = node.data.href || "#";
      const btnBg = node.data.backgroundColor || (node.data.variant === "secondary" ? "#374151" : "#3b82f6");
      const btnColor = node.data.textColor || "#ffffff";
      const btnFontSize = node.data.fontSize || 16;
      const btnBorderRadius = node.data.borderRadius ?? 8;
      const btnPadding = node.data.padding || "12px 24px";
      const btnFontWeight = node.data.fontWeight || 600;
      const btnOpacity = node.data.opacity ?? 1;
      const btnRotation = node.data.rotation || 0;
      const btnBoxShadow = node.data.boxShadow || "none";
      const btnBorder = node.data.border || "none";
      const btnWidth = node.data.width || "auto";
      
      return `<a href="${href}" style="display:inline-flex;align-items:center;justify-content:center;padding:${btnPadding};border-radius:${btnBorderRadius}px;text-decoration:none;background:${btnBg};color:${btnColor};font-weight:${btnFontWeight};font-size:${btnFontSize}px;min-width:120px;height:44px;white-space:nowrap;opacity:${btnOpacity};transform:rotate(${btnRotation}deg);box-shadow:${btnBoxShadow};border:${btnBorder};width:${btnWidth};">${label}</a>`;

    case "image":
      const imgSrc = node.data.src || "https://via.placeholder.com/300x200";
      const imgAlt = node.data.alt || "Image";
      const imgWidth = node.data.width || 300;
      const imgHeight = node.data.height || 200;
      const imgBorderRadius = node.data.borderRadius || 0;
      const imgOpacity = node.data.opacity ?? 1;
      const imgRotation = node.data.rotation || 0;
      const imgBoxShadow = node.data.boxShadow || "none";
      const imgBorder = node.data.border || "none";
      const imgObjectFit = node.data.objectFit || "cover";
      
      return `<img src="${imgSrc}" alt="${imgAlt}" style="width:${imgWidth}px;height:${imgHeight}px;border-radius:${imgBorderRadius}px;opacity:${imgOpacity};transform:rotate(${imgRotation}deg);box-shadow:${imgBoxShadow};border:${imgBorder};object-fit:${imgObjectFit};display:block;" />`;

    case "container":
      // const containerLabel = node.data.label || "Container"; // Unused for now
      const containerWidth = node.data.width || 400;
      const containerHeight = node.data.height || 300;
      const containerBg = node.data.backgroundColor || "#f3f4f6";
      const containerBorderRadius = node.data.borderRadius || 8;
      const containerPadding = node.data.padding || 20;
      const containerOpacity = node.data.opacity ?? 1;
      const containerRotation = node.data.rotation || 0;
      const containerBoxShadow = node.data.boxShadow || "none";
      const containerBorder = node.data.border || "none";
      const containerDisplay = node.data.display || "flex";
      const containerFlexDirection = node.data.flexDirection || "column";
      const containerJustifyContent = node.data.justifyContent || "flex-start";
      const containerAlignItems = node.data.alignItems || "flex-start";
      const containerGap = node.data.gap || 12;
      
      return `<div style="width:${containerWidth}px;height:${containerHeight}px;background-color:${containerBg};border-radius:${containerBorderRadius}px;padding:${containerPadding}px;opacity:${containerOpacity};transform:rotate(${containerRotation}deg);box-shadow:${containerBoxShadow};border:${containerBorder};display:${containerDisplay};flex-direction:${containerFlexDirection};justify-content:${containerJustifyContent};align-items:${containerAlignItems};gap:${containerGap}px;"></div>`;

    case "formInput":
      const inputLabel = node.data.label || "";
      const inputPlaceholder = node.data.placeholder || "Enter text...";
      const inputType = node.data.inputType || "text";
      const inputWidth = node.data.width || 300;
      const inputFontSize = node.data.fontSize || 14;
      const inputBgColor = node.data.backgroundColor || "#ffffff";
      const inputBorderColor = node.data.borderColor || "#d1d5db";
      const inputBorderRadius = node.data.borderRadius || 6;
      const inputPadding = node.data.padding || 10;
      const inputRequired = node.data.required || false;
      
      return `<div style="display:flex;flex-direction:column;gap:6px;">
        ${inputLabel ? `<label style="font-size:14px;font-weight:500;color:#374151;">${inputLabel}${inputRequired ? '<span style="color:#ef4444;"> *</span>' : ''}</label>` : ''}
        <input type="${inputType}" placeholder="${inputPlaceholder}" style="width:${inputWidth}px;font-size:${inputFontSize}px;background-color:${inputBgColor};border:1px solid ${inputBorderColor};border-radius:${inputBorderRadius}px;padding:${inputPadding}px;" ${inputRequired ? 'required' : ''} />
      </div>`;
    
    case "formTextarea":
      const textareaLabel = node.data.label || "";
      const textareaPlaceholder = node.data.placeholder || "Enter your message...";
      const textareaWidth = node.data.width || 300;
      const textareaHeight = node.data.height || 100;
      const textareaFontSize = node.data.fontSize || 14;
      const textareaBgColor = node.data.backgroundColor || "#ffffff";
      const textareaBorderColor = node.data.borderColor || "#d1d5db";
      const textareaBorderRadius = node.data.borderRadius || 6;
      const textareaPadding = node.data.padding || 10;
      const textareaRequired = node.data.required || false;
      const textareaRows = node.data.rows || 4;
      
      return `<div style="display:flex;flex-direction:column;gap:6px;">
        ${textareaLabel ? `<label style="font-size:14px;font-weight:500;color:#374151;">${textareaLabel}${textareaRequired ? '<span style="color:#ef4444;"> *</span>' : ''}</label>` : ''}
        <textarea placeholder="${textareaPlaceholder}" rows="${textareaRows}" style="width:${textareaWidth}px;height:${textareaHeight}px;font-size:${textareaFontSize}px;background-color:${textareaBgColor};border:1px solid ${textareaBorderColor};border-radius:${textareaBorderRadius}px;padding:${textareaPadding}px;font-family:inherit;resize:vertical;" ${textareaRequired ? 'required' : ''}></textarea>
      </div>`;

    case "shape":
      const shapeType = node.data.shapeType || "rectangle";
      const shapeWidth = node.data.width || 100;
      const shapeHeight = node.data.height || 100;
      const shapeBg = node.data.backgroundColor || "#3b82f6";
      const shapeBorderRadius = node.data.borderRadius || 0;
      const shapeOpacity = node.data.opacity ?? 1;
      const shapeRotation = node.data.rotation || 0;
      const shapeBoxShadow = node.data.boxShadow || "none";
      const shapeBorder = node.data.border || "none";
      
      let shapeStyle = `width:${shapeWidth}px;height:${shapeHeight}px;background-color:${shapeBg};opacity:${shapeOpacity};transform:rotate(${shapeRotation}deg);box-shadow:${shapeBoxShadow};border:${shapeBorder};`;
      
      if (shapeType === "circle") {
        shapeStyle += "border-radius:50%;";
      } else if (shapeType === "triangle") {
        shapeStyle += `width:0;height:0;border-left:${shapeWidth/2}px solid transparent;border-right:${shapeWidth/2}px solid transparent;border-bottom:${shapeHeight}px solid ${shapeBg};background-color:transparent;`;
      } else {
        shapeStyle += `border-radius:${shapeBorderRadius}px;`;
      }
      
      return `<div style="${shapeStyle}"></div>`;

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
        // Check if this section has columns
        if (n.data.columns && n.data.columns.count > 0) {
          // Collect all nodes that belong to this section
          const sectionChildren: TreeNode[] = [];
          allNodes.forEach((node) => {
            if (node.data?._ownedByColumn === n.id) {
              sectionChildren.push(node);
            }
          });
          
          // Render children with absolute positioning using their exact coordinates
          const childrenHtml = sectionChildren
            .map((childNode) => {
              const nodeHtml = renderNode(childNode);
              const x = childNode.position?.x || 0;
              const y = childNode.position?.y || 0;
              return `<div style="position:absolute;left:${x}px;top:${y}px;">${nodeHtml}</div>`;
            })
            .join("\n    ");

          return `${nodeContent}
    ${childrenHtml}
  </div>
</section>`;
        } else {
          // Regular section without columns
          return `${nodeContent}
    ${children}
  </div>
</section>`;
        }
      }

      // ColumnsSection renders columns with their children
      if (n.type === "columnsSection") {
        const columnCount = n.data.columns?.count || 2;
        
        // Build children map from allNodes using _ownedByColumn and _columnIndex
        const childrenByColumn: { [key: number]: TreeNode[] } = {};
        allNodes.forEach((node) => {
          if (node.data?._ownedByColumn === n.id) {
            const colIndex = node.data._columnIndex ?? 0;
            if (!childrenByColumn[colIndex]) {
              childrenByColumn[colIndex] = [];
            }
            childrenByColumn[colIndex].push(node);
          }
        });

        // Check if any column has children
        const hasChildren = Object.values(childrenByColumn).some(
          (col) => col && col.length > 0
        );

        // Skip empty columns sections
        if (!hasChildren) return "";

        // Render each column with its children
        const columnsHtml = Array.from({ length: columnCount })
          .map((_, colIndex) => {
            const columnChildren = (childrenByColumn[colIndex] || [])
              .map((childNode) => renderNode(childNode))
              .filter(Boolean)
              .join("\n        ");

            return `
      <div style="display:flex;flex-direction:column;gap:16px;">
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
  // Filter to only include builder nodes (exclude workflow nodes and column children)
  const filteredTree = filterBuilderNodes(tree, allNodes || tree);
  const bodyContent = renderTree(filteredTree, allNodes || filteredTree);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}
