import type { Node as ReactFlowNode } from "reactflow";

interface UseCanvasActionsProps {
  selectedNodes: ReactFlowNode[];
  selectedNode: ReactFlowNode | null;
  setNodes: (updater: any) => void;
  setSelectedNode: (node: ReactFlowNode | null) => void;
  setSelectedNodes: (nodes: ReactFlowNode[]) => void;
  clipboard: any[];
  setClipboard: (nodes: any[]) => void;
  nodes: any[];
}

export function useCanvasActions({
  selectedNodes,
  selectedNode,
  setNodes,
  setSelectedNode,
  setSelectedNodes,
  clipboard,
  setClipboard,
  nodes,
}: UseCanvasActionsProps) {
  // Alignment and distribution handlers
  const handleAlign = (type: string) => {
    if (selectedNodes.length < 2) return;

    const positions = selectedNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
    let newX: number, newY: number;

    switch (type) {
      case "left":
        newX = Math.min(...positions.map(p => p.x));
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find(sn => sn.id === n.id)
              ? { ...n, position: { ...n.position, x: newX } }
              : n
          )
        );
        break;
      case "right":
        newX = Math.max(...positions.map(p => p.x));
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find(sn => sn.id === n.id)
              ? { ...n, position: { ...n.position, x: newX } }
              : n
          )
        );
        break;
      case "center-h":
        const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find(sn => sn.id === n.id)
              ? { ...n, position: { ...n.position, x: avgX } }
              : n
          )
        );
        break;
      case "top":
        newY = Math.min(...positions.map(p => p.y));
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find(sn => sn.id === n.id)
              ? { ...n, position: { ...n.position, y: newY } }
              : n
          )
        );
        break;
      case "bottom":
        newY = Math.max(...positions.map(p => p.y));
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find(sn => sn.id === n.id)
              ? { ...n, position: { ...n.position, y: newY } }
              : n
          )
        );
        break;
      case "center-v":
        const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
        setNodes((nds: any) =>
          nds.map((n: any) =>
            selectedNodes.find(sn => sn.id === n.id)
              ? { ...n, position: { ...n.position, y: avgY } }
              : n
          )
        );
        break;
    }
  };

  const handleDistribute = (type: string) => {
    if (selectedNodes.length < 3) return;

    const sorted = [...selectedNodes].sort((a, b) =>
      type === "horizontal" ? a.position.x - b.position.x : a.position.y - b.position.y
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpace =
      type === "horizontal"
        ? last.position.x - first.position.x
        : last.position.y - first.position.y;
    const gap = totalSpace / (sorted.length - 1);

    setNodes((nds: any) =>
      nds.map((n: any) => {
        const index = sorted.findIndex(sn => sn.id === n.id);
        if (index === -1 || index === 0 || index === sorted.length - 1) return n;

        return {
          ...n,
          position:
            type === "horizontal"
              ? { ...n.position, x: first.position.x + gap * index }
              : { ...n.position, y: first.position.y + gap * index },
        };
      })
    );
  };

  const handleDuplicate = () => {
    const nodesToDuplicate = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToDuplicate.length === 0) return;

    const newNodes = nodesToDuplicate.map((node: any) => ({
      ...node,
      id: `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: false,
    }));

    setNodes((nds: any) => [...nds, ...newNodes]);
  };

  const handleDelete = () => {
    const nodesToDelete = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToDelete.length === 0) return;

    const idsToDelete = nodesToDelete.map(n => n.id);
    setNodes((nds: any) => nds.filter((n: any) => !idsToDelete.includes(n.id)));
    setSelectedNode(null);
    setSelectedNodes([]);
  };

  const handleCopy = () => {
    const nodesToCopy = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToCopy.length === 0) return;
    setClipboard(nodesToCopy);
  };

  const handlePaste = () => {
    if (clipboard.length === 0) return;

    const newNodes = clipboard.map((node: any) => ({
      ...node,
      id: `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
    }));

    setNodes((nds: any) => [...nds, ...newNodes]);
  };

  const handleSelectAll = () => {
    const selectableNodes = nodes.filter((n: any) => n.type !== "section");
    setSelectedNodes(selectableNodes);
  };

  const handleDeselect = () => {
    setSelectedNode(null);
    setSelectedNodes([]);
  };

  const handleSetColumns = (count: number) => {
    if (selectedNodes.length === 1 && selectedNodes[0].type === "section") {
      const sectionId = selectedNodes[0].id;
      setNodes((nds: any) =>
        nds.map((n: any) =>
          n.id === sectionId
            ? {
                ...n,
                data: {
                  ...n.data,
                  columns: {
                    count,
                    gap: n.data.columns?.gap || 24,
                  },
                },
              }
            : n
        )
      );
    }
  };

  const handleCut = () => {
    handleCopy();
    handleDelete();
  };

  return {
    handleAlign,
    handleDistribute,
    handleDuplicate,
    handleDelete,
    handleCopy,
    handlePaste,
    handleSelectAll,
    handleDeselect,
    handleSetColumns,
    handleCut,
  };
}
