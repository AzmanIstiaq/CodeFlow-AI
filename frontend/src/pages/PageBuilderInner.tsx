import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useReactFlow } from "reactflow";
import ReactFlow from "reactflow";
import type { Node as ReactFlowNode } from "reactflow";
import "reactflow/dist/style.css";
import "../styles/reactflow-overrides.css";

import NodeToolbar from "../components/builder/NodeToolbar";
import StartNode from "../components/builder/Nodes/StartNode";
import AINode from "../components/builder/Nodes/AINode";
import OutputNode from "../components/builder/Nodes/OutputNode";
import TextNode from "../components/builder/Nodes/TextNode";
import SectionNode from "../components/builder/Nodes/SectionNode";
import ButtonNode from "../components/builder/Nodes/ButtonNode";
import ImageNode from "../components/builder/Nodes/ImageNode";
import ContainerNode from "../components/builder/Nodes/ContainerNode";
import ShapeNode from "../components/builder/Nodes/ShapeNode";
import FormInputNode from "../components/builder/Nodes/FormInputNode";
import FormTextareaNode from "../components/builder/Nodes/FormTextareaNode";
import FormCheckboxNode from "../components/builder/Nodes/FormCheckboxNode";
import FormRadioNode from "../components/builder/Nodes/FormRadioNode";
import FormSelectNode from "../components/builder/Nodes/FormSelectNode";
import NodeEditorPanel from "../components/builder/NodeEditorPanel";
import SaveWorkflowDialog from "../components/builder/dialogs/SaveWorkflowDialog";
import LayerPanel from "../components/builder/LayerPanel";
import AlignmentToolbar from "../components/builder/AlignmentToolbar";
import SmartGuides from "../components/builder/SmartGuides";
import ZoomControls from "../components/builder/ZoomControls";
import MenuBar from "../components/builder/MenuBar";
import { useKeyboardShortcuts } from "../components/builder/hooks/useKeyboardShortcuts";
import { useSmartGuides } from "../components/builder/hooks/useSmartGuides";
import { useHistory } from "../components/builder/hooks/useHistory";

import { useSiteState } from "../components/builder/hooks/useSiteState";
import { useNodeOperations } from "../components/builder/hooks/useNodeOperations";
import { useColumnDropZones } from "../components/builder/hooks/useColumnDropZones";
import { useWorkflowOperations } from "../components/builder/hooks/useWorkflowOperations";

// Mode: "workflow" for AI execution, "builder" for page building
const MODE: "workflow" | "builder" = "builder";

// ✅ Static nodeTypes - defined ONCE outside component (referential equality preserved)
const nodeTypes = {
  start: StartNode,
  ai: AINode,
  output: OutputNode,
  text: TextNode,
  section: SectionNode,
  button: ButtonNode,
  image: ImageNode,
  container: ContainerNode,
  shape: ShapeNode,
  formInput: FormInputNode,
  formTextarea: FormTextareaNode,
  formCheckbox: FormCheckboxNode,
  formRadio: FormRadioNode,
  formSelect: FormSelectNode,
};

// Helper function to get default data for each node type
const getDefaultNodeData = (type: string, label: string) => {
  switch (type) {
    case "text":
      return {
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
        width: 200,
      };
    case "button":
      return {
        label: "Click Me",
        href: "#",
        variant: "primary",
        borderRadius: 8,
        opacity: 1,
        rotation: 0,
      };
    case "image":
      return {
        src: "https://via.placeholder.com/300x200",
        alt: "Image",
        width: 300,
        height: 200,
        borderRadius: 0,
        opacity: 1,
        rotation: 0,
        objectFit: "cover",
      };
    case "container":
      return {
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
      };
    case "shape":
      return {
        shapeType: "rectangle",
        width: 100,
        height: 100,
        backgroundColor: "#3b82f6",
        borderRadius: 0,
        opacity: 1,
        rotation: 0,
      };
    case "formInput":
      return {
        placeholder: "Enter text...",
        inputType: "text",
        width: 300,
        fontSize: 14,
        padding: 10,
        required: false,
      };
    case "formTextarea":
      return {
        placeholder: "Enter your message...",
        width: 300,
        height: 100,
        fontSize: 14,
        padding: 10,
        required: false,
        rows: 4,
      };
    case "section":
      return {
        label,
        padding: 40,
        gap: 24,
        align: "start",
        maxWidth: 1200,
        backgroundColor: "#000000",
        columns: {
          count: 1,
          gap: 24,
        },
      };
    default:
      return { label };
  }
};

export default function PageBuilderInner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<ReactFlowNode[]>([]);
  const [clipboard, setClipboard] = useState<any[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [placementMode, setPlacementMode] = useState<{ type: string; label: string } | null>(null);
  const [drawingMode, setDrawingMode] = useState<{ type: string; label: string; start: { x: number; y: number } } | null>(null);
  const [drawingPreview, setDrawingPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const isDrawingRef = useRef(false);

  // 🎯 Clean hook-based architecture
  const {
    site,
    setSite,
    activePage,
    nodes,
    edges,
    updateActivePage,
    setNodes,
    handlePageSelect,
    handlePageAdd,
    handlePageDelete,
    handlePageRename,
  } = useSiteState(id);

  const { onNodesChange, onEdgesChange, onConnect, addNode } =
    useNodeOperations(activePage, updateActivePage);

  const {
    registerColumnRect,
    handleMoveEnd,
    handleNodeDrag,
    handleNodeDragStop,
    viewportVersion,
    hoverState,
  } = useColumnDropZones(nodes, setNodes);

  const hasFrame = nodes.some((n: any) => n.type === "section");

  const { save, handleExportHTML, dialogProps } =
    useWorkflowOperations(id, site, activePage, setNodes);

  // Smart guides for alignment with grid snapping
  const { activeGuides, handleDrag: handleGuideDrag, clearGuides, snapToGuides } = useSmartGuides(nodes, showGrid);
  const reactFlowInstance = useReactFlow();
  const viewport = reactFlowInstance.getViewport();

  // History (undo/redo) - keyboard shortcuts handled in useHistory hook
  useHistory(nodes, setNodes);

  // Handle ESC key to cancel placement mode or drawing mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (placementMode) setPlacementMode(null);
        if (drawingMode) {
          setDrawingMode(null);
          setDrawingPreview(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placementMode, drawingMode]);

  // Drawing mode handlers using global mouse events
  useEffect(() => {
    if (!drawingMode) return;

    const handleMouseDown = (event: MouseEvent) => {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setDrawingMode({ ...drawingMode, start: position });
      isDrawingRef.current = true;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawingRef.current || !drawingMode.start) return;
      
      const currentPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const x = Math.min(drawingMode.start.x, currentPos.x);
      const y = Math.min(drawingMode.start.y, currentPos.y);
      const width = Math.abs(currentPos.x - drawingMode.start.x);
      const height = Math.abs(currentPos.y - drawingMode.start.y);
      
      setDrawingPreview({ x, y, width, height });
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
      if (!drawingMode.start || !drawingPreview || drawingPreview.width < 10 || drawingPreview.height < 10) {
        setDrawingMode(null);
        setDrawingPreview(null);
        return;
      }
      
      const nodeId = `${drawingMode.type}-${Date.now()}`;
      const newNode: any = {
        id: nodeId,
        type: drawingMode.type,
        position: { x: drawingPreview.x, y: drawingPreview.y },
        draggable: true,
        data: {
          ...getDefaultNodeData(drawingMode.type, drawingMode.label),
          width: Math.round(drawingPreview.width),
          height: Math.round(drawingPreview.height),
        },
      };
      
      setNodes((nds: any) => [...nds, newNode]);
      setDrawingMode(null);
      setDrawingPreview(null);
      setSelectedNode(newNode);
      setSelectedNodes([newNode]);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drawingMode, drawingPreview, reactFlowInstance, setNodes, setSelectedNode, setSelectedNodes]);

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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedNodes: selectedNodes.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [],
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onSelectAll: handleSelectAll,
    onDeselect: handleDeselect,
  });


  const hasSelection = selectedNodes.length > 0 || selectedNode !== null;

  return (
    <>
      <SaveWorkflowDialog {...dialogProps} />
      <MenuBar
        onSave={save}
        onExport={handleExportHTML}
        onNavigateHome={() => navigate("/")}
        onNavigateDashboard={() => navigate("/dashboard")}
        pages={site.pages}
        activePageId={site.activePageId}
        onPageSelect={handlePageSelect}
        onPageAdd={handlePageAdd}
        onPageRename={handlePageRename}
        onPageDelete={handlePageDelete}
        onUndo={() => {}}
        onRedo={() => {}}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onSelectAll={handleSelectAll}
        onDeselect={handleDeselect}
        onDuplicate={handleDuplicate}
        onLock={handleLock}
        onHide={handleHide}
        onBringToFront={handleBringToFront}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onSendToBack={handleSendToBack}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onZoomIn={() => reactFlowInstance.zoomIn()}
        onZoomOut={() => reactFlowInstance.zoomOut()}
        onZoomToFit={() => reactFlowInstance.fitView({ padding: 0.2, duration: 200 })}
        onZoomTo100={handleZoomTo100}
        onViewportChange={setPreviewMode}
        currentViewport={previewMode}
        showGrid={showGrid}
        canUndo={false}
        canRedo={false}
        hasSelection={hasSelection}
      />

      <div className={`visualbuilder-root ${selectedNode ? "panel-open" : ""}`}>
        <AlignmentToolbar
          selectedNodes={selectedNodes}
          onAlign={handleAlign}
          onDistribute={handleDistribute}
          onDuplicate={handleDuplicate}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onSetColumns={handleSetColumns}
          visible={hasFrame && (selectedNodes.length > 0 || selectedNode !== null)}
        />
        {hasFrame && (
          <LayerPanel
            nodes={nodes}
            selectedNode={selectedNode}
            onNodeSelect={(node) => {
              setSelectedNode(node);
              setSelectedNodes([node]);
            }}
            onNodeDelete={(nodeId) => {
              setNodes((nds: any) => nds.filter((n: any) => n.id !== nodeId));
              if (selectedNode?.id === nodeId) {
                setSelectedNode(null);
              }
              setSelectedNodes((sns) => sns.filter((n) => n.id !== nodeId));
            }}
            onNodeVisibilityToggle={() => {}}
            onNodeLock={() => {}}
            onUpdateNode={(nodeId: string, updates: any) => {
              setNodes((nds: any) =>
                nds.map((n: any) => {
                  if (n.id === nodeId) {
                    return {
                      ...n,
                      data: { ...n.data, ...updates },
                      draggable: !updates.locked && n.draggable !== false,
                      hidden: updates.hidden,
                    };
                  }
                  return n;
                })
              );
            }}
            onReorderNodes={(nodeId: string, targetIndex: number) => {
              setNodes((nds: any) => {
                const nodesCopy = [...nds];
                const draggedIndex = nodesCopy.findIndex((n) => n.id === nodeId);
                if (draggedIndex === -1) return nds;
                
                // Remove the dragged node
                const [draggedNode] = nodesCopy.splice(draggedIndex, 1);
                
                // Insert at target index
                nodesCopy.splice(targetIndex, 0, draggedNode);
                
                // Update z-index/order for all nodes
                return nodesCopy.map((node, index) => ({
                  ...node,
                  zIndex: node.type === "section" ? 0 : index + 1,
                  data: {
                    ...node.data,
                    order: index,
                  },
                }));
              });
            }}
          />
        )}
        <div className="visualbuilder-canvas">
          {placementMode && (
            <div style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#3b82f6",
              color: "white",
              padding: "8px 16px",
              borderRadius: 6,
              zIndex: 1000,
              fontSize: 14,
              fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>
              Click on canvas to place {placementMode.label} • Press ESC to cancel
            </div>
          )}
          {drawingMode && (
            <div style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#10b981",
              color: "white",
              padding: "8px 16px",
              borderRadius: 6,
              zIndex: 1000,
              fontSize: 14,
              fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>
              Click and drag to draw {drawingMode.label} • Press ESC to cancel
            </div>
          )}
          <NodeToolbar 
            addNode={(type, label) => {
              // Use drawing mode for shapes and containers
              if (type === 'shape' || type === 'container') {
                setDrawingMode({ type, label, start: { x: 0, y: 0 } });
              } else {
                setPlacementMode({ type, label });
              }
            }}
            mode={MODE} 
            hasFrame={hasFrame} 
          />

          {!hasFrame ? (
            <div
              className="empty-canvas"
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
                color: "#6b7280",
              }}
            >
              <h2>Add a Frame to get started</h2>
              <button
                className="btn-primary"
                onClick={() => addNode("section", "Frame")}
              >
                ➕ Add Frame
              </button>
            </div>
          ) : (
            <>
            <SmartGuides guides={activeGuides} viewport={viewport} />
            {drawingPreview && (
              <div
                style={{
                  position: "absolute",
                  left: drawingPreview.x * viewport.zoom + viewport.x,
                  top: drawingPreview.y * viewport.zoom + viewport.y,
                  width: drawingPreview.width * viewport.zoom,
                  height: drawingPreview.height * viewport.zoom,
                  border: "2px dashed #3b82f6",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  pointerEvents: "none",
                  zIndex: 1000,
                }}
              />
            )}
            {showGrid && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundImage: `
                    linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: "8px 8px",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
            )}
            <ZoomControls showGrid={showGrid} onToggleGrid={() => setShowGrid(!showGrid)} />
            <ReactFlow
              nodes={nodes
                .filter((n: any) => !n.data?.hidden)
                .map((n: any) => {
                  const isSelected = selectedNode?.id === n.id || selectedNodes.some(sn => sn.id === n.id);
                  if (n.type === "section") {
                    return {
                      ...n,
                      zIndex: 0,
                      draggable: false,
                      selected: isSelected,
                      data: {
                        ...n.data,
                        _allNodes: nodes,
                        _registerColumnRect: registerColumnRect,
                        _viewportVersion: viewportVersion,
                        _hoverState: hoverState,
                      },
                    };
                  }
                  return {
                    ...n,
                    selected: isSelected,
                    draggable: !n.data?.locked,
                  };
                })}
              edges={MODE === "builder" ? [] : edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={(event, node) => {
                if (placementMode) {
                  // Get click position in flow coordinates
                  const position = reactFlowInstance.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                  });
                  
                  // Create node at clicked position
                  const nodeId = `${placementMode.type}-${Date.now()}`;
                  const newNode: any = {
                    id: nodeId,
                    type: placementMode.type,
                    position,
                    draggable: true,
                    data: getDefaultNodeData(placementMode.type, placementMode.label),
                  };
                  
                  setNodes((nds: any) => [...nds, newNode]);
                  setPlacementMode(null);
                  setSelectedNode(newNode);
                  setSelectedNodes([newNode]);
                } else {
                  setSelectedNode(node);
                  setSelectedNodes([node]);
                }
              }}
              onEdgesChange={MODE === "builder" ? () => {} : onEdgesChange}
              onConnect={MODE === "builder" ? () => {} : onConnect}
              isValidConnection={() => MODE === "workflow"}
              nodesConnectable={MODE === "workflow"}
              nodesDraggable={!drawingMode}
              elementsSelectable={!drawingMode}
              selectNodesOnDrag={false}
              elevateNodesOnSelect={false}
              panOnDrag={drawingMode ? false : true}
              zoomOnScroll={!drawingMode}
              onNodeDragStart={(_, node) => {
                setSelectedNode(node);
                setSelectedNodes([node]);
              }}
              onNodeDrag={(_, node) => {
                handleNodeDrag(node);
                handleGuideDrag(node);
              }}
              onNodeDragStop={(event, node) => {
                handleNodeDragStop(event, node);
                clearGuides();
              }}
              onPaneClick={(event) => {
                if (placementMode) {
                  // Get click position in flow coordinates
                  const position = reactFlowInstance.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                  });
                  
                  // Create node at clicked position
                  const nodeId = `${placementMode.type}-${Date.now()}`;
                  const newNode: any = {
                    id: nodeId,
                    type: placementMode.type,
                    position,
                    draggable: true,
                    data: getDefaultNodeData(placementMode.type, placementMode.label),
                  };
                  
                  setNodes((nds: any) => [...nds, newNode]);
                  setPlacementMode(null);
                  setSelectedNode(newNode);
                  setSelectedNodes([newNode]);
                } else {
                  setSelectedNode(null);
                  setSelectedNodes([]);
                }
              }}
              multiSelectionKeyCode="Shift"
              defaultEdgeOptions={{
                style: { stroke: "transparent" },
                animated: false,
              }}
              fitView
              style={{ 
                width: "100%", 
                height: "100%",
                cursor: placementMode ? "crosshair" : drawingMode ? "crosshair" : "default"
              }}
              onMoveEnd={handleMoveEnd}
            >
            </ReactFlow>
            </>
          )}
        </div>

        {selectedNode && (
          <div className="node-editor-panel">
            <NodeEditorPanel
              node={nodes.find((n: any) => n.id === selectedNode.id) || selectedNode}
              closePanel={() => setSelectedNode(null)}
              updateNodeData={(id: string, newData: any) => {
                const node = nodes.find((n: any) => n.id === id);

                if (
                  node?.type === "columnsSection" &&
                  newData.columns !== node.data.columns
                ) {
                  return;
                }

                setNodes((nds: any) =>
                  nds.map((n: any) =>
                    n.id === id ? { ...n, data: newData } : n
                  )
                );
              }}
              updateNodes={(updater: (nodes: any[]) => any[]) => {
                setNodes(updater);
              }}
              edges={edges}
              nodes={nodes}
            />
          </div>
        )}
      </div>
    </>
  );
}
