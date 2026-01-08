import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useReactFlow, useViewport } from "reactflow";
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
import RowNode from "../components/builder/Nodes/RowNode";
import { InspectorPanel } from "../components/builder/Inspector";
import SaveWorkflowDialog from "../components/builder/dialogs/SaveWorkflowDialog";
import LayerPanel from "../components/builder/LayerPanel";
import AlignmentToolbar from "../components/builder/AlignmentToolbar";
import SmartGuides from "../components/builder/SmartGuides";
import ZoomControls from "../components/builder/ZoomControls";
import MenuBar from "../components/builder/MenuBar";
import { useKeyboardShortcuts } from "../components/builder/hooks/useKeyboardShortcuts";
import { useSmartGuides } from "../components/builder/hooks/useSmartGuides";
import { useHistory } from "../components/builder/hooks/useHistory";

import { useCanvasDrawing } from "./canvas/useCanvasDrawing";
import { useCanvasActions } from "./canvas/useCanvasActions";
import { useCanvasLayers } from "./canvas/useCanvasLayers";

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
  row: RowNode,
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

// Enforce consistent layering across all node operations.
const normalizeZIndex = (nodeList: any[]) =>
  nodeList.map((node: any) => {
    const zIndex = node.type === "section" ? 0 : node.type === "row" ? 1 : 10;
    return node.zIndex === zIndex ? node : { ...node, zIndex };
  });

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
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingRadius, setIsEditingRadius] = useState(false);

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

  // Normalize zIndex on every node update to keep rows below content.
  const setNodesNormalized = (updater: any) => {
    setNodes((nds: any) => {
      const next = typeof updater === "function" ? updater(nds) : updater;
      return Array.isArray(next) ? normalizeZIndex(next) : next;
    });
  };

  const { onNodesChange, onEdgesChange, onConnect, addNode } =
    useNodeOperations(activePage, updateActivePage);

  const {
    registerColumnRect,
    handleMoveEnd,
    handleNodeDrag,
    handleNodeDragStop,
    viewportVersion,
    hoverState,
    findDropTarget,
  } = useColumnDropZones(nodes, setNodesNormalized);

  const hasFrame = nodes.some((n: any) => n.type === "section");

  const { save, handleExportHTML, dialogProps } =
    useWorkflowOperations(id, site, activePage, setNodesNormalized);

  // Smart guides for alignment
  const reactFlowInstance = useReactFlow();
  // Use useViewport hook to get reactive viewport that updates on pan/zoom
  const viewport = useViewport();
  const {
    activeGuides,
    handleDrag: handleGuideDrag,
    clearGuides,
    snapToGuides,
    setOverrideKey,
    setSnapThreshold,
    setGridSnap,
  } = useSmartGuides(nodes, reactFlowInstance);
  
  // Track currently dragging node for snapping
  const draggingNodeRef = useRef<ReactFlowNode | null>(null);
  
  // Handle override key (Ctrl/Cmd) for free movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setOverrideKey(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setOverrideKey(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setOverrideKey]);

  // History (undo/redo) - keyboard shortcuts handled in useHistory hook
  useHistory(nodes, setNodesNormalized);

  // Canvas drawing (ESC key + drawing mode)
  useCanvasDrawing({
    placementMode,
    setPlacementMode,
    drawingMode,
    setDrawingMode,
    drawingPreview,
    setDrawingPreview,
    isDrawingRef,
    reactFlowInstance,
    setNodes: setNodesNormalized,
    setSelectedNode,
    setSelectedNodes,
    getDefaultNodeData,
  });

  // Canvas actions (alignment, distribution, copy/paste, etc.)
  const {
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
  } = useCanvasActions({
    selectedNodes,
    selectedNode,
    setNodes: setNodesNormalized,
    setSelectedNode,
    setSelectedNodes,
    clipboard,
    setClipboard,
    nodes,
  });

  // Canvas layers (lock, hide, z-index, zoom)
  const {
    handleLock,
    handleHide,
    handleBringToFront,
    handleBringForward,
    handleSendBackward,
    handleSendToBack,
    handleZoomTo100,
  } = useCanvasLayers({
    selectedNodes,
    selectedNode,
    setNodes: setNodesNormalized,
    setSelectedNode,
    setSelectedNodes,
    reactFlowInstance,
  });

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

  const rowLayoutById = useMemo(() => {
    const layout = new Map<string, { x: number; y: number; width: number }>();
    const sections = nodes.filter((n: any) => n.type === "section");

    sections.forEach((section: any) => {
      const sectionPadding = 0;
      const sectionGap = 0;
      const sectionWidth = section.width ?? section.data?.pageWidth ?? section.data?.maxWidth ?? 0;

      const rows = nodes
        .filter((n: any) => n.type === "row" && n.parentNode === section.id)
        .sort((a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0));

      let currentY = sectionPadding;
      rows.forEach((row: any) => {
        const isOnlyRow = rows.length === 1;
        layout.set(row.id, { x: 0, y: currentY, width: sectionWidth });
        const rowHeight = isOnlyRow
          ? section.data?.pageHeight ?? row.data?.rowHeight ?? row.height ?? 0
          : row.data?.rowHeight ?? row.height ?? 0;
        currentY += rowHeight + sectionGap;
      });
    });

    return layout;
  }, [nodes]);

  const placeNodeAtEvent = (event: any) => {
    if (!placementMode) return false;
    const flowPoint = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const target = findDropTarget(flowPoint);
    if (!target) return false;

    const { ownerId, columnIndex, rect } = target;
    const columnWidth = rect.right - rect.left;
    const localX = Math.max(0, Math.min(columnWidth, flowPoint.x - rect.left));
    const localY = flowPoint.y - rect.top;

    const nodeId = `${placementMode.type}-${Date.now()}`;
    const defaultData = getDefaultNodeData(placementMode.type, placementMode.label);
    const newNode: any = {
      id: nodeId,
      type: placementMode.type,
      parentNode: ownerId,
      position: {
        x: columnWidth * columnIndex + localX,
        y: localY,
      },
      draggable: true,
      style: defaultData.width ? {
        width: defaultData.width,
        ...(defaultData.height ? { height: defaultData.height } : {}),
      } : undefined,
      data: {
        ...defaultData,
        _rowId: ownerId,
        _ownedByColumn: ownerId,
        _columnIndex: columnIndex,
        _localY: localY,
        columnIndex,
      },
    };

    setNodesNormalized((nds: any) => [...nds, newNode]);
    setPlacementMode(null);
    setSelectedNode(newNode);
    setSelectedNodes([newNode]);
    return true;
  };

  const selectFrameAtPoint = (event: any) => {
    const flowPoint = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const frame = nodes.find((n: any) => n.type === "section");
    if (!frame) return false;
    const width = frame.width ?? frame.data?.pageWidth ?? 0;
    const height = frame.height ?? frame.data?.pageHeight ?? 0;
    const within =
      flowPoint.x >= frame.position.x &&
      flowPoint.x <= frame.position.x + width &&
      flowPoint.y >= frame.position.y &&
      flowPoint.y <= frame.position.y + height;
    if (within) {
      setSelectedNode(frame);
      setSelectedNodes([frame]);
      return true;
    }
    return false;
  };

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
            nodes={normalizeZIndex(nodes)}
            selectedNode={selectedNode}
            onNodeSelect={(node) => {
              if (node.type === "row") {
                const parentSection = nodes.find(
                  (n: any) => n.type === "section" && n.id === node.parentNode
                );
                if (parentSection) {
                  setSelectedNode(parentSection);
                  setSelectedNodes([parentSection]);
                }
                return;
              }
              setSelectedNode(node);
              setSelectedNodes([node]);
            }}
            onNodeDelete={(nodeId) => {
              const target = nodes.find((n: any) => n.id === nodeId);
              if (target?.type === "section") return;
              if (target?.type === "row") {
                setNodesNormalized((nds: any) =>
                  nds.filter(
                    (n: any) =>
                      n.id !== nodeId &&
                      n.parentNode !== nodeId &&
                      n.data?._rowId !== nodeId
                  )
                );
                if (selectedNode?.id === nodeId) {
                  setSelectedNode(null);
                }
                setSelectedNodes((sns) => sns.filter((n) => n.id !== nodeId));
                return;
              }
              setNodesNormalized((nds: any) => nds.filter((n: any) => n.id !== nodeId));
              if (selectedNode?.id === nodeId) {
                setSelectedNode(null);
              }
              setSelectedNodes((sns) => sns.filter((n) => n.id !== nodeId));
            }}
            onNodeVisibilityToggle={() => {}}
            onNodeLock={() => {}}
            onUpdateNode={(nodeId: string, updates: any) => {
              setNodesNormalized((nds: any) =>
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
              setNodesNormalized((nds: any) => {
                const nodesCopy = [...nds];
                const draggedIndex = nodesCopy.findIndex((n) => n.id === nodeId);
                if (draggedIndex === -1) return nds;
                
                // Remove the dragged node
                const [draggedNode] = nodesCopy.splice(draggedIndex, 1);
                
                // Insert at target index
                nodesCopy.splice(targetIndex, 0, draggedNode);

                // Update order only; zIndex is normalized separately.
                return nodesCopy.map((node, index) => ({
                  ...node,
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
                // Render order must respect zIndex to keep rows below content nodes.
                .filter((n: any) => !n.data?.hidden)
                .sort((a: any, b: any) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                .map((n: any) => {
                  const isSelected =
                    selectedNode?.id === n.id ||
                    selectedNodes.some((sn) => sn.id === n.id);
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
                      style: {
                        ...n.style,
                        zIndex: 0,
                      },
                    };
                  }
                  if (n.type === "row") {
                    const layout = rowLayoutById.get(n.id);
                    return {
                      ...n,
                      zIndex: 1,
                      draggable: false,
                      selectable: false,
                      position: layout ? { x: layout.x, y: layout.y } : n.position,
                      selected: isSelected,
                      data: {
                        ...n.data,
                        _allNodes: nodes,
                        _registerColumnRect: registerColumnRect,
                        _viewportVersion: viewportVersion,
                        _hoverState: hoverState,
                        _onColumnClick: (event: any) => {
                          if (placementMode) {
                            placeNodeAtEvent(event);
                            return;
                          }
                          const parentSection = nodes.find(
                            (node: any) => node.type === "section" && node.id === n.parentNode
                          );
                          if (parentSection) {
                            setSelectedNode(parentSection);
                            setSelectedNodes([parentSection]);
                          }
                        },
                        _onRowMeasure: (rowId: string, height: number) => {
                          setNodesNormalized((nds: any) =>
                            nds.map((node: any) => {
                              if (node.id !== rowId) return node;
                              if (node.data?.rowHeight === height) return node;
                              return {
                                ...node,
                                data: {
                                  ...node.data,
                                  rowHeight: height,
                                },
                              };
                            })
                          );
                        },
                      },
                      style: {
                        ...n.style,
                        zIndex: 1,
                        width: layout?.width ?? n.style?.width,
                      },
                    };
                  }
                  return {
                    ...n,
                    selected: isSelected,
                    draggable: !n.data?.locked,
                    data: {
                      ...n.data,
                      onUpdateText: (newText: string) => {
                        setNodes((nds: any) =>
                          nds.map((node: any) => {
                            if (node.id === n.id) {
                      _onResizeStart: () => setIsResizing(true),
                      _onResizeEnd: () => setIsResizing(false),
                      _onRadiusStart: () => setIsEditingRadius(true),
                      _onRadiusEnd: () => setIsEditingRadius(false),
                      _onResize: (_event: any, params: any) => {
                        setNodesNormalized((nds: any) =>
                          nds.map((node: any) =>
                            node.id === n.id
                              ? {
                                  ...node,
                                  position: {
                                    x: params.x,
                                    y: params.y,
                                  },
                                  style: {
                                    ...node.style,
                                    width: params.width,
                                    height: params.height,
                                    zIndex: n.zIndex ?? 10,
                                  },
                                  data: {
                                    ...node.data,
                                    width: Math.round(params.width),
                                    height: Math.round(params.height),
                                  },
                                }
                              : node
                          )
                        );
                      },
                      _onRadiusChange: (radius: number, corner?: string) => {
                        setNodesNormalized((nds: any) =>
                          nds.map((node: any) => {
                            if (node.id !== n.id) return node;
                            
                            if (corner) {
                              // Individual corner editing (Ctrl pressed)
                              const currentRadius = typeof node.data.borderRadius === 'number' 
                                ? { topLeft: node.data.borderRadius, topRight: node.data.borderRadius, bottomLeft: node.data.borderRadius, bottomRight: node.data.borderRadius }
                                : { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0, ...node.data.borderRadius };
                              
                              return {
                                ...node,
                                data: {
                                  ...node.data,
                                  // Update label for buttons, text for text nodes, placeholder for form inputs
                                  ...(node.type === "button" ? { label: newText } : {}),
                                  ...(node.type === "text" ? { text: newText } : {}),
                                  ...(node.type === "formInput" ? { placeholder: newText } : {}),
                                },
                              };
                            }
                            return node;
                          })
                        );
                      },
                      onUpdateLabel: (newText: string) => {
                        setNodes((nds: any) =>
                          nds.map((node: any) => {
                            if (node.id === n.id) {
                                  borderRadius: {
                                    ...currentRadius,
                                    [corner]: radius,
                                  },
                                },
                              };
                            } else {
                              // All corners (no Ctrl)
                              return {
                                ...node,
                                data: {
                                  ...node.data,
                                  label: newText,
                                },
                              };
                            }
                            return node;
                          })
                        );
                      },
                    },
                                  borderRadius: radius,
                                },
                              };
                            }
                          })
                        );
                      },
                    },
                    style: {
                      ...n.style,
                      zIndex: n.zIndex ?? 10,
                    },
                  };
                })}
              edges={MODE === "builder" ? [] : edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={(event, node) => {
                if (node.type === "row") {
                  const parentSection = nodes.find(
                    (n: any) => n.type === "section" && n.id === node.parentNode
                  );
                  if (parentSection) {
                    setSelectedNode(parentSection);
                    setSelectedNodes([parentSection]);
                  }
                  return;
                }
                event.stopPropagation();
                if (placementMode) {
                  placeNodeAtEvent(event);
                  return;
                }
                setSelectedNode(node);
                setSelectedNodes([node]);
              }}
              onEdgesChange={MODE === "builder" ? () => {} : onEdgesChange}
              onConnect={MODE === "builder" ? () => {} : onConnect}
              isValidConnection={() => MODE === "workflow"}
              nodesConnectable={MODE === "workflow"}
              nodesDraggable={!drawingMode && !isResizing && !isEditingRadius}
              elementsSelectable={!drawingMode}
              selectNodesOnDrag={true}
              elevateNodesOnSelect={false}
              panOnDrag={drawingMode ? false : true}
              zoomOnScroll={!drawingMode}
              onNodeDragStart={(_, node) => {
                if (node.type === "row") return;
                setSelectedNode(node);
                setSelectedNodes([node]);
                draggingNodeRef.current = node;
              }}
              onNodeDrag={(_, node) => {
                handleNodeDrag(node);
                handleGuideDrag(node);
              }}
              onNodeDragStop={(event, node) => {
                // Apply snapping on drag stop
                if (node.positionAbsolute && node.width && node.height) {
                  const snapped = snapToGuides(node, {
                    x: node.positionAbsolute.x,
                    y: node.positionAbsolute.y,
                  });
                  
                  if (snapped.snapped) {
                    // Calculate the new position based on the snapped absolute position
                    // positionAbsolute accounts for parent transforms, so we need to use it directly
                    const currentAbsoluteX = node.positionAbsolute.x;
                    const currentAbsoluteY = node.positionAbsolute.y;
                    const deltaX = snapped.x - currentAbsoluteX;
                    const deltaY = snapped.y - currentAbsoluteY;
                    
                    // Update the node's position (relative to parent or flow)
                    setNodes((nds: any) =>
                      nds.map((n: any) => {
                        if (n.id === node.id) {
                          // If node has a parent, we need to account for parent position
                          // For now, assume position is in flow coordinates
                          return {
                            ...n,
                            position: {
                              x: n.position.x + deltaX,
                              y: n.position.y + deltaY,
                            },
                          };
                        }
                        return n;
                      })
                    );
                  }
                }
                
                handleNodeDragStop(event, node);
                clearGuides();
                draggingNodeRef.current = null;
              }}
              onPaneClick={(event) => {
                if (placementMode) {
                  placeNodeAtEvent(event);
                  return;
                }
                if (!selectFrameAtPoint(event)) {
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

        {selectedNodes.length > 0 && (
          <InspectorPanel
            selectedNodes={selectedNodes.map(sn => nodes.find((n: any) => n.id === sn.id) || sn)}
            allNodes={nodes}
            updateNode={(id: string, updates: any) => {
              setNodesNormalized((nds: any) => {
                const updatedNodes = nds.map((n: any) => {
                  if (n.id === id) {
                    return {
                      ...n,
                      data: { ...n.data, ...updates },
                      position: updates.position !== undefined ? updates.position : n.position,
                      style: {
                        ...n.style,
                        ...(updates.width !== undefined ? { width: updates.width } : {}),
                        ...(updates.height !== undefined ? { height: updates.height } : {}),
                      },
                    };
                  }
                  return n;
                });
                
                // Update selectedNodes with fresh data from the new nodes array
                setSelectedNodes(prev =>
                  prev.map(sn => {
                    const updated = updatedNodes.find((n: any) => n.id === sn.id);
                    return updated || sn;
                  })
                );
                
                return updatedNodes;
              });
            }}
            updateNodes={(ids: string[], updates: any) => {
              setNodesNormalized((nds: any) => {
                const { __addNode, ...restUpdates } = updates || {};
                if (__addNode) {
                  return [...nds, __addNode];
                }

                const updatedNodes = nds.map((n: any) => {
                  if (ids.includes(n.id)) {
                    return {
                      ...n,
                      data: { ...n.data, ...restUpdates },
                      position: restUpdates.position !== undefined ? restUpdates.position : n.position,
                      style: {
                        ...n.style,
                        ...(restUpdates.width !== undefined ? { width: restUpdates.width } : {}),
                        ...(restUpdates.height !== undefined ? { height: restUpdates.height } : {}),
                      },
                    };
                  }
                  return n;
                });
                
                // Update selectedNodes with fresh data from the new nodes array
                setSelectedNodes(prev =>
                  prev.map(sn => {
                    const updated = updatedNodes.find((n: any) => n.id === sn.id);
                    return updated || sn;
                  })
                );
                
                return updatedNodes;
              });
            }}
            deleteNode={(id: string) => {
              setNodesNormalized((nds: any) => nds.filter((n: any) => n.id !== id));
              setSelectedNodes([]);
              setSelectedNode(null);
            }}
            deleteNodes={(ids: string[]) => {
              setNodesNormalized((nds: any) => nds.filter((n: any) => !ids.includes(n.id)));
              setSelectedNodes([]);
              setSelectedNode(null);
            }}
            onClose={() => {
              setSelectedNodes([]);
              setSelectedNode(null);
            }}
          />
        )}
      </div>
    </>
  );
}
