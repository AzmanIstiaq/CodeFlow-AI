import type { Node as ReactFlowNode } from "reactflow";
import type { ReactFlowInstance } from "reactflow";

interface UseCanvasLayersProps {
  selectedNodes: ReactFlowNode[];
  selectedNode: ReactFlowNode | null;
  setNodes: (updater: any) => void;
  setSelectedNode: (node: ReactFlowNode | null) => void;
  setSelectedNodes: (nodes: ReactFlowNode[]) => void;
  reactFlowInstance: ReactFlowInstance;
}

export function useCanvasLayers({
  selectedNodes,
  selectedNode,
  setNodes,
  setSelectedNode,
  setSelectedNodes,
  reactFlowInstance,
}: UseCanvasLayersProps) {
  const handleLock = () => {
    const nodesToLock = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToLock.length === 0) return;
    
    setNodes((nds: any) =>
      nds.map((n: any) =>
        nodesToLock.some(sn => sn.id === n.id)
          ? { ...n, data: { ...n.data, locked: true }, draggable: false }
          : n
      )
    );
  };

  const handleHide = () => {
    const nodesToHide = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToHide.length === 0) return;
    
    setNodes((nds: any) =>
      nds.map((n: any) =>
        nodesToHide.some(sn => sn.id === n.id)
          ? { ...n, data: { ...n.data, hidden: true } }
          : n
      )
    );
    setSelectedNode(null);
    setSelectedNodes([]);
  };

  const handleBringToFront = () => {
    const nodesToMove = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToMove.length === 0) return;
    
    setNodes((nds: any) => {
      const maxZIndex = Math.max(...nds.map((n: any) => n.zIndex || 0));
      return nds.map((n: any) =>
        nodesToMove.some(sn => sn.id === n.id)
          ? { ...n, zIndex: maxZIndex + 1 }
          : n
      );
    });
  };

  const handleBringForward = () => {
    const nodesToMove = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToMove.length === 0) return;
    
    setNodes((nds: any) => {
      return nds.map((n: any) =>
        nodesToMove.some(sn => sn.id === n.id)
          ? { ...n, zIndex: (n.zIndex || 0) + 1 }
          : n
      );
    });
  };

  const handleSendBackward = () => {
    const nodesToMove = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToMove.length === 0) return;
    
    setNodes((nds: any) => {
      return nds.map((n: any) =>
        nodesToMove.some(sn => sn.id === n.id)
          ? { ...n, zIndex: Math.max(0, (n.zIndex || 0) - 1) }
          : n
      );
    });
  };

  const handleSendToBack = () => {
    const nodesToMove = selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
    if (nodesToMove.length === 0) return;
    
    setNodes((nds: any) => {
      return nds.map((n: any) =>
        nodesToMove.some(sn => sn.id === n.id)
          ? { ...n, zIndex: 0 }
          : n
      );
    });
  };

  const handleZoomTo100 = () => {
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
  };

  return {
    handleLock,
    handleHide,
    handleBringToFront,
    handleBringForward,
    handleSendBackward,
    handleSendToBack,
    handleZoomTo100,
  };
}
