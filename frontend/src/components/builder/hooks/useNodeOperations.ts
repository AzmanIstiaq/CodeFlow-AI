import type { Connection } from "reactflow";
import { addEdge } from "reactflow";
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

  // Node/Edge change handlers
  const onNodesChange = (changes: any) => {
    import("reactflow").then(({ applyNodeChanges }) => {
      let newNodes = applyNodeChanges(changes, nodes);

      const hasDeletes = changes.some((c: any) => c.type === "remove");
      if (hasDeletes) {
        newNodes = normalizeOrder(newNodes, edges);
        newNodes
          .filter((n: any) => n.type === "section")
          .forEach((section: any) => {
            normalizeOrder(newNodes, edges, section.id);
          });
      }

      const updatedNodes = newNodes.map((n: any) => {
        if (n.type === "section") {
          const hasSelectedChild = edges.some(
            (e) =>
              e.source === n.id &&
              newNodes.find(
                (child: any) => child.id === e.target && child.selected
              )
          );
          return {
            ...n,
            data: { ...n.data, isParentOfSelected: hasSelectedChild },
          };
        }
        return n;
      });

      updateActivePage({ nodes: updatedNodes });
    });
  };

  const onEdgesChange = (changes: any) => {
    import("reactflow").then(({ applyEdgeChanges }) => {
      updateActivePage({ edges: applyEdgeChanges(changes, edges) });
    });
  };

  const onConnect = (connection: Connection) => {
    const source = nodes.find((n: any) => n.id === connection.source);
    const target = nodes.find((n: any) => n.id === connection.target);

    if (!source || !target) return;

    if (source.type !== "section") {
      alert("Only Sections can contain elements.");
      return;
    }

    const hasParent = edges.some((e: any) => e.target === target.id);
    if (hasParent) {
      alert("This element already belongs to a Section.");
      return;
    }

    setEdges((eds: any) => addEdge(connection, eds));
  };

  const addNode = (type: string, label: string): void => {
    const id = generateId(type);

    let data: any = {};
    let position = {
      x: Math.random() * 400 + 200,
      y: Math.random() * 200 + 200,
    };

    if (type === "button") {
      const section = nodes.find((n: any) => n.type === "section");
      if (!section) {
        alert("Add a Section before adding a Button.");
        return;
      }

      const siblings = nodes.filter((n: any) =>
        edges.some((e: any) => e.source === section.id && e.target === n.id)
      );
      data = {
        label: "Click Me",
        href: "#",
        variant: "primary",
        order: siblings.length,
      };

      const newNode = {
        id,
        type: "button",
        position: {
          x: section.position.x + 40,
          y: section.position.y + 80 + siblings.length * 40,
        },
        data,
      };

      setNodes((nds: any) => [...nds, newNode]);
      setEdges((eds: any) => [
        ...eds,
        { id: `${section.id}-${id}`, source: section.id, target: id },
      ]);
      return;
    }

    if (type === "text") {
      const section = nodes.find((n: any) => n.type === "section");
      const siblings = section
        ? nodes.filter((n: any) =>
            edges.some((e: any) => e.source === section.id && e.target === n.id)
          )
        : [];

      data = {
        text: "Sample Text",
        fontSize: 14,
        color: "#ffffff",
        order: siblings.length,
      };

      if (section) {
        position = { x: section.position.x + 40, y: section.position.y + 40 };
      }
    } else if (type === "section") {
      const sectionCount = nodes.filter(
        (n: any) => n.type === "section"
      ).length;
      data = {
        label,
        padding: 40,
        gap: 16,
        align: "start",
        maxWidth: 960,
        backgroundColor: "#000000",
        order: sectionCount,
      };
    } else if (type === "columnsSection") {
      const sectionCount = nodes.filter(
        (n: any) => n.type === "section" || n.type === "columnsSection"
      ).length;
      data = {
        label: "Columns Section",
        columns: 2,
        gap: 24,
        align: "start",
        maxWidth: 960,
        padding: 32,
        backgroundColor: "#000000",
        order: sectionCount,
        children: { 0: [], 1: [] },
      };
    } else {
      data = { label: type.toUpperCase(), order: 0 };
    }

    const newNode = { id, type, position, data };
    setNodes((nds: any) => [...nds, newNode]);

    if (type === "text") {
      const section = nodes.find((n: any) => n.type === "section");
      if (section) {
        setEdges((eds: any) => [
          ...eds,
          { id: `${section.id}-${id}`, source: section.id, target: id },
        ]);
      }
    }
  };

  const updateColumnsCount = (nodeId: string, newCount: number) => {
    setNodes((nds: any) =>
      nds.map((n: any) => {
        if (n.id === nodeId && n.type === "columnsSection") {
          const nextChildren = { ...(n.data.children ?? {}) };

          for (let i = 0; i < newCount; i++)
            if (!nextChildren[i]) nextChildren[i] = [];
          Object.keys(nextChildren).forEach((k) => {
            if (Number(k) >= newCount) delete nextChildren[k];
          });

          return {
            ...n,
            data: { ...n.data, columns: newCount, children: nextChildren },
          };
        }
        return n;
      })
    );
  };

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateColumnsCount,
  };
}
