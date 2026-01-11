/**
 * useNodeOperations Hook
 *
 * Handles all node and edge change operations in the canvas.
 * Responsible for:
 * - Applying ReactFlow's node/edge changes to page state
 * - Preserving column ownership metadata during updates
 * - Managing node lifecycle (creation, deletion, reordering)
 * - Creating new nodes with appropriate default properties
 *
 * Key Concepts:
 * 1. Column Ownership: Custom metadata (_ownedByColumn, _columnIndex) can be lost
 *    during ReactFlow updates, so we preserve it explicitly
 * 2. Node Ordering: normalizeOrder() maintains z-index consistency after deletions
 * 3. Section Requirement: Most node types require a parent section; function alerts if missing
 * 4. Position Calculation: New nodes placed adjacent to section with appropriate spacing
 *
 * Node Position Pattern:
 * - For section nodes: Place below existing sections with vertical spacing
 * - For non-column nodes: Place to right of section with type-specific vertical offset
 * - Spacing prevents overlap and improves visual layout
 */

import type { Connection } from "reactflow";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";
import type { PageSchema } from "../../../types/siteSchema";
import { generateId, normalizeOrder } from "../utils/nodeHelpers";

export function useNodeOperations(
  activePage: PageSchema,
  updateActivePage: (updates: Partial<PageSchema>) => void
) {
  const nodes = activePage.nodes;
  const edges = activePage.edges;

  // =====================================
  // STATE ADAPTER FUNCTIONS
  // =====================================
  // Provide ReactFlow-compatible setNodes/setEdges interface

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

  // =====================================
  // NODE CHANGE HANDLER
  // =====================================
  /**
   * Handle node changes from ReactFlow
   *
   * Key operations:
   * 1. Preserve column ownership metadata (custom data that can be lost)
   * 2. Apply ReactFlow's changes
   * 3. Normalize z-index ordering if nodes were deleted
   * 4. Update section parent indicator for visual feedback
   *
   * Column Ownership:
   * - Nodes can have _ownedByColumn metadata indicating they belong to a column
   * - This metadata can be lost during certain ReactFlow operations
   * - We restore it after applying changes to maintain consistency
   *
   * Parent Selection Indicator:
   * - Sections track if any child is selected for visual highlighting
   * - This is recalculated on every change to stay in sync
   */
  const onNodesChange = (changes: any) => {
    // ========== PRESERVE METADATA ==========
    // Create map of column ownership data for all nodes that have it
    const columnDataMap = new Map();
    nodes.forEach((n: any) => {
      if (n.data?._ownedByColumn) {
        columnDataMap.set(n.id, {
          _ownedByColumn: n.data._ownedByColumn,
          _columnIndex: n.data._columnIndex,
        });
      }
    });

    // ========== APPLY CHANGES ==========
    // Let ReactFlow apply its standard changes (position, selection, etc.)
    let newNodes = applyNodeChanges(changes, nodes);

    // ========== NORMALIZE ON DELETE ==========
    // If any nodes were deleted, recalculate z-index ordering
    const hasDeletes = changes.some((c: any) => c.type === "remove");
    if (hasDeletes) {
      newNodes = normalizeOrder(newNodes, edges);
    }

    // ========== RESTORE & ENHANCE DATA ==========
    // Restore column metadata and recalculate section selection state
    const updatedNodes = newNodes.map((n: any) => {
      // Restore column ownership data if it was lost
      const columnData = columnDataMap.get(n.id);
      const dataWithColumn = columnData ? { ...n.data, ...columnData } : n.data;

      // For sections, track if any child is selected (for visual feedback)
      if (n.type === "section") {
        const hasSelectedChild = newNodes.some(
          (child: any) => child.parentId === n.id && child.selected
        );
        return {
          ...n,
          data: { ...dataWithColumn, isParentOfSelected: hasSelectedChild },
        };
      }
      return {
        ...n,
        data: dataWithColumn,
      };
    });

    updateActivePage({ nodes: updatedNodes });
  };

  // =====================================
  // EDGE CHANGE HANDLER
  // =====================================
  /**
   * Handle edge changes from ReactFlow
   *
   * Note: Edge changes are simpler than node changes
   * We don't need to preserve custom metadata for edges
   * Just apply changes and update page state
   */
  const onEdgesChange = (changes: any) => {
    let newEdges = applyEdgeChanges(changes, edges);
    updateActivePage({ edges: newEdges });
  };

  // =====================================
  // CONNECTION HANDLER
  // =====================================
  /**
   * Handle new connections between nodes
   *
   * Creates edge when user drags from one node handle to another
   * Used in workflow mode for creating node graphs
   */
  const onConnect = (connection: Connection) => {
    setEdges((eds: any) => addEdge(connection, eds));
  };

  // =====================================
  // ADD NODE
  // =====================================
  /**
   * Add new node to canvas
   *
   * Flow:
   * 1. Generate unique ID for node
   * 2. Check node type and create appropriate default properties
   * 3. Calculate position (stacked/offset from existing similar nodes)
   * 4. Add to nodes array
   *
   * Node Types:
   * - section: Top-level container (no dependencies)
   * - Everything else: Requires a section to exist
   *
   * Position Logic:
   * - Sections: Stacked vertically with fixed spacing (200 + count * 120)
   * - Other nodes: Placed to right of section, vertically offset by count
   * - Offset prevents overlap and creates natural visual layout
   */
  const addNode = (type: string, label: string) => {
    const id = generateId(type);

    const section = nodes.find((n: any) => n.type === "section");

    // =====================================
    // SECTION NODE
    // =====================================
    // Sections are top-level containers, no dependencies
    if (type === "section") {
      const sectionCount = nodes.filter(
        (n: any) => n.type === "section"
      ).length;

      const newNode = {
        id,
        type: "section",
        position: {
          x: 200,
          y: 200 + sectionCount * 120,
        },
        data: {
          label,
          padding: 40,
          gap: 24,
          align: "start",
          maxWidth: 1200,
          backgroundColor: "#000000",
          order: sectionCount,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // =====================================
    // CHECK SECTION REQUIREMENT
    // =====================================
    // All other node types need a section parent
    if (!section) {
      alert("Add a Frame first.");
      return;
    }

    // =====================================
    // TEXT NODE
    // =====================================
    // Display text content with styling
    if (type === "text") {
      const textCount = nodes.filter(
        (n: any) => n.type === "text" && !n.data?._ownedByColumn
      ).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "text",
        position: {
          x: section.position.x + sectionWidth + 100,
          y: section.position.y + 100 + textCount * 80,
        },
        draggable: true,
        style: {},
        data: {
          text: "Sample Text",
          fontSize: 16,
          color: "#111827",
          fontWeight: 400,
          fontFamily: "inherit",
          textAlign: "left",
          lineHeight: 1.6,
          letterSpacing: 0,
          opacity: 1,
          rotation: 0,
          textShadow: "none",
          backgroundColor: "transparent",
          padding: 16,
          borderRadius: 0,
          border: "none",
          layout: undefined,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // =====================================
    // BUTTON NODE
    // =====================================
    // Interactive clickable element
    if (type === "button") {
      const buttonCount = nodes.filter(
        (n: any) => n.type === "button" && !n.data?._ownedByColumn
      ).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "button",
        position: {
          x: section.position.x + sectionWidth + 250,
          y: section.position.y + 100 + buttonCount * 80,
        },
        draggable: true,
        style: {
          width: 150,
          height: 44,
        },
        data: {
          label: "Click Me",
          href: "#",
          variant: "primary",
          layout: undefined,
          borderRadius: 8,
          opacity: 1,
          rotation: 0,
          width: 150,
          height: 44,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // =====================================
    // IMAGE NODE
    // =====================================
    // Display image with sizing and object-fit options
    if (type === "image") {
      const imageCount = nodes.filter(
        (n: any) => n.type === "image" && !n.data?._ownedByColumn
      ).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "image",
        position: {
          x: section.position.x + sectionWidth + 100,
          y: section.position.y + 100 + imageCount * 250,
        },
        draggable: true,
        style: {
          width: 300,
          height: 200,
        },
        data: {
          src: "https://via.placeholder.com/300x200",
          alt: "Image",
          width: 300,
          height: 200,
          borderRadius: 0,
          opacity: 1,
          rotation: 0,
          objectFit: "cover",
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // =====================================
    // CONTAINER NODE
    // =====================================
    // Flexible flex-based container for layout
    if (type === "container") {
      const containerCount = nodes.filter(
        (n: any) => n.type === "container" && !n.data?._ownedByColumn
      ).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "container",
        position: {
          x: section.position.x + sectionWidth + 100,
          y: section.position.y + 100 + containerCount * 350,
        },
        draggable: true,
        style: {
          width: 400,
          height: 300,
        },
        data: {
          label: "Container",
          width: 400,
          height: 300,
          backgroundColor: "#f3f4f6",
          borderRadius: 8,
          padding: 20,
          opacity: 1,
          rotation: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 12,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // =====================================
    // SHAPE NODE
    // =====================================
    // Geometric shape (rectangle, circle, etc.)
    if (type === "shape") {
      const shapeCount = nodes.filter(
        (n: any) => n.type === "shape" && !n.data?._ownedByColumn
      ).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "shape",
        position: {
          x: section.position.x + sectionWidth + 100,
          y: section.position.y + 100 + shapeCount * 150,
        },
        draggable: true,
        style: {
          width: 100,
          height: 100,
        },
        data: {
          shapeType: "rectangle",
          width: 100,
          height: 100,
          backgroundColor: "#3b82f6",
          borderRadius: 0,
          opacity: 1,
          rotation: 0,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // =====================================
    // FORM INPUT NODE
    // =====================================
    // Single-line text input field
    if (type === "formInput") {
      const formInputCount = nodes.filter(
        (n: any) => n.type === "formInput" && !n.data?._ownedByColumn
      ).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "formInput",
        position: {
          x: section.position.x + sectionWidth + 100,
          y: section.position.y + 100 + formInputCount * 100,
        },
        draggable: true,
        style: {
          width: 300,
        },
        data: {
          placeholder: "Enter text...",
          inputType: "text",
          width: 300,
          fontSize: 14,
          padding: 10,
          required: false,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // =====================================
    // FORM TEXTAREA NODE
    // =====================================
    // Multi-line text input field
    if (type === "formTextarea") {
      const formTextareaCount = nodes.filter(
        (n: any) => n.type === "formTextarea" && !n.data?._ownedByColumn
      ).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "formTextarea",
        position: {
          x: section.position.x + sectionWidth + 100,
          y: section.position.y + 100 + formTextareaCount * 150,
        },
        draggable: true,
        style: {
          width: 300,
          height: 100,
        },
        data: {
          placeholder: "Enter your message...",
          width: 300,
          height: 100,
          fontSize: 14,
          padding: 10,
          required: false,
          rows: 4,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }
  };

  // =====================================
  // HOOK EXPORTS
  // =====================================
  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  };
}
