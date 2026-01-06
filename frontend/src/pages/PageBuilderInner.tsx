import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useReactFlow, useViewport } from "reactflow";
import ReactFlow from "reactflow";
import type { Node as ReactFlowNode } from "reactflow";
import "reactflow/dist/style.css";
import "../styles/reactflow-overrides.css";

import NodeToolbar from "../components/builder/NodeToolbar";
import PageTabs from "../components/builder/PageTabs";
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

export default function PageBuilderInner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<ReactFlowNode[]>([]);
  const [clipboard, setClipboard] = useState<any[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

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
  } = useColumnDropZones(setSite, nodes, setNodes);

  const hasFrame = nodes.some((n: any) => n.type === "section");

  const { save, handleExportHTML, runWorkflow, isExecuting, dialogProps } =
    useWorkflowOperations(id, site, activePage, setNodes);

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
  useHistory(nodes, setNodes);

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
          <NodeToolbar addNode={addNode} mode={MODE} hasFrame={hasFrame} />

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
                  backgroundSize: "20px 20px",
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
                    zIndex: 1,
                    selected: isSelected,
                    draggable: !n.data?.locked,
                    data: {
                      ...n.data,
                      onUpdateText: (newText: string) => {
                        setNodes((nds: any) =>
                          nds.map((node: any) => {
                            if (node.id === n.id) {
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
                  };
                })}
              edges={MODE === "builder" ? [] : edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={(_, node) => {
                setSelectedNode(node);
                setSelectedNodes([node]);
              }}
              onEdgesChange={MODE === "builder" ? () => {} : onEdgesChange}
              onConnect={MODE === "builder" ? () => {} : onConnect}
              isValidConnection={() => MODE === "workflow"}
              nodesConnectable={MODE === "workflow"}
              nodesDraggable={true}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              onNodeDragStart={(_, node) => {
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
              onPaneClick={() => {
                setSelectedNode(null);
                setSelectedNodes([]);
              }}
              multiSelectionKeyCode="Shift"
              defaultEdgeOptions={{
                style: { stroke: "transparent" },
                animated: false,
              }}
              fitView
              style={{ width: "100%", height: "100%" }}
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
