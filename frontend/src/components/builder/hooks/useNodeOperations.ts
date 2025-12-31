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

  // -------------------------------
  // NODE CHANGE HANDLER
  // -------------------------------
  const onNodesChange = (changes: any) => {
    // Preserve column ownership data before applying changes
    const columnDataMap = new Map();
    nodes.forEach((n: any) => {
      if (n.data?._ownedByColumn) {
        columnDataMap.set(n.id, {
          _ownedByColumn: n.data._ownedByColumn,
          _columnIndex: n.data._columnIndex,
        });
      }
    });

    let newNodes = applyNodeChanges(changes, nodes);

    const hasDeletes = changes.some((c: any) => c.type === "remove");
    if (hasDeletes) {
      newNodes = normalizeOrder(newNodes, edges);
    }

    const updatedNodes = newNodes.map((n: any) => {
      // Restore column ownership data if it was lost
      const columnData = columnDataMap.get(n.id);
      const dataWithColumn = columnData
        ? { ...n.data, ...columnData }
        : n.data;

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

  // -------------------------------
  // EDGE CHANGE HANDLER (workflow only)
  // -------------------------------
  const onEdgesChange = (changes: any) => {
    let newEdges = applyEdgeChanges(changes, edges);
    updateActivePage({ edges: newEdges });
  };

  // -------------------------------
  // CONNECTIONS (workflow mode only)
  // -------------------------------
  const onConnect = (connection: Connection) => {
    setEdges((eds: any) => addEdge(connection, eds));
  };

  // -------------------------------
  // ADD NODE
  // -------------------------------
  const addNode = (type: string, label: string) => {
    const id = generateId(type);

    const section = nodes.find((n: any) => n.type === "section");

    // ---------------- SECTION ----------------
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
          columns: {
            count: 1,
            gap: 24,
          },
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // Everything below needs a section
    if (!section) {
      alert("Add a Frame first.");
      return;
    }

    // ---------------- TEXT ----------------
    if (type === "text") {
      const textCount = nodes.filter((n: any) => n.type === "text" && !n.data?._ownedByColumn).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "text",
        position: { 
          x: section.position.x + sectionWidth + 100, 
          y: section.position.y + 100 + (textCount * 80) 
        },
        draggable: true,
        data: {
          text: "Sample Text",
          fontSize: 14,
          color: "#111827",
          layout: undefined,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }

    // ---------------- BUTTON ----------------
    if (type === "button") {
      const buttonCount = nodes.filter((n: any) => n.type === "button" && !n.data?._ownedByColumn).length;
      const sectionWidth = section.data?.maxWidth || 1200;
      const newNode = {
        id,
        type: "button",
        position: { 
          x: section.position.x + sectionWidth + 250, 
          y: section.position.y + 100 + (buttonCount * 80) 
        },
        draggable: true,
        data: {
          label: "Click Me",
          href: "#",
          variant: "primary",
          layout: undefined,
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      return;
    }
  };

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  };
}
