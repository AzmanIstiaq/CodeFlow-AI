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
    let newNodes = applyNodeChanges(changes, nodes);

    const hasDeletes = changes.some((c: any) => c.type === "remove");
    if (hasDeletes) {
      newNodes = normalizeOrder(newNodes, edges);
    }

    const updatedNodes = newNodes.map((n: any) => {
      if (n.type === "section") {
        const hasSelectedChild = newNodes.some(
          (child: any) => child.parentId === n.id && child.selected
        );
        return {
          ...n,
          data: { ...n.data, isParentOfSelected: hasSelectedChild },
        };
      }
      return n;
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
      const newNode = {
        id,
        type: "text",
        parentId: section.id,
        position: { x: 0, y: 0 },
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
      const newNode = {
        id,
        type: "button",
        parentId: section.id,
        position: { x: 0, y: 0 },
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
