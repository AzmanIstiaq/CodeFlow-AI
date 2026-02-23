import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { allowCanvasDrag } from "../../frontendRules/interaction/interactionResolvers";
import {
  shouldUseSmartGuides,
} from "../../frontendRules/interaction/interactionPolicy";
import { shouldRedirectRowSelection } from "../../frontendRules/selection/selectionPolicy";
import { normalizeZIndex } from "../../frontendRules/layering/layeringResolvers";

interface UsePageBuilderInnerHandlersProps {
  nodes: any[];
  selectedNode: any;
  selectedNodes: any[];
  inspectorSelection: any[];
  layoutById: Map<string, any>;
  getFlowRenderPosition: (node: any) => any;
  setShowGrid: (value: any) => void;
  reactFlowInstance: any;
  selectSectionWithBars: (node: any) => void;
  setSelectedNode: (node: any) => void;
  setSelectedNodes: (nodes: any[] | ((prev: any[]) => any[])) => void;
  setNodesNormalized: (updater: any) => void;
  handleNodeDrag: (event: any, node: any) => void;
  handleGuideDrag: (node: any) => void;
  handleNodeDragStop: (event: any, node: any) => void;
  clearGuides: () => void;
  placementMode: any;
  placeNodeAtEvent: (event: any) => boolean;
  selectFrameAtPoint: (event: any) => boolean;
  setDrawingMode: (value: any) => void;
  setPlacementMode: (value: any) => void;
  addNode: (type: string, label: string) => void;
  refreshNodeInternals: (ids: string | string[]) => void;
  drawingMode: any;
  isResizing: boolean;
  isEditingRadius: boolean;
}

/**
 * usePageBuilderInnerHandlers
 *
 * Purpose:
 * - Centralize UI-facing callbacks that were previously inline in `PageBuilderInner`.
 * - Keep callback references stable so memoized children (`MenuBar`, `LayerPanel`, `ReactFlow`,
 *   `InspectorPanel`) do not re-render from function identity churn alone.
 *
 * Scope:
 * - UI wiring only (selection orchestration, panel handlers, menu actions, canvas event bridges).
 * - No core layout/rule math lives here; that remains in domain hooks/resolvers.
 *
 * Behavioral constraints preserved from previous inline logic:
 * - Row selection can redirect to parent section.
 * - Section selection can become a section+bars bundle.
 * - Section nodes are protected from layer-panel delete action.
 * - Inspector updates keep selected snapshots synchronized and refresh node internals on size changes.
 */
export function usePageBuilderInnerHandlers({
  nodes,
  selectedNode,
  selectedNodes,
  inspectorSelection,
  layoutById,
  getFlowRenderPosition,
  setShowGrid,
  reactFlowInstance,
  selectSectionWithBars,
  setSelectedNode,
  setSelectedNodes,
  setNodesNormalized,
  handleNodeDrag,
  handleGuideDrag,
  handleNodeDragStop,
  clearGuides,
  placementMode,
  placeNodeAtEvent,
  selectFrameAtPoint,
  setDrawingMode,
  setPlacementMode,
  addNode,
  refreshNodeInternals,
  drawingMode,
  isResizing,
  isEditingRadius,
}: UsePageBuilderInnerHandlersProps) {
  // UI-wiring hook: keeps PageBuilderInner focused on orchestration while
  // preserving stable callback identities for heavy children.
  const navigate = useNavigate();

  // Fast node lookup used by selection and panel handlers.
  const nodeById = useMemo(() => {
    const map = new Map<string, any>();
    nodes.forEach((n: any) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Layer panel expects canonical ordering.
  const normalizedLayerNodes = useMemo(() => normalizeZIndex(nodes), [nodes]);

  // Alignment toolbar should stay hidden when selection is only a frame bundle
  // (section + optional header/footer).
  const isSectionBundle = useMemo(
    () =>
      selectedNodes.some((n) => n.type === "section") &&
      selectedNodes.every((n) =>
        ["section", "header", "footer"].includes(n.type as string)
      ),
    [selectedNodes]
  );

  const inspectorPanelSelectedNodes = useMemo(
    () =>
      inspectorSelection.map((sn) => {
        // Use latest node snapshot from canvas state when available.
        const node = nodeById.get(sn.id) || sn;
        if (node.type === "header" || node.type === "footer") {
          // Header/footer are rendered as full-width bars in inspector context.
          // Resolve width from parent/page layout first to match canvas rendering.
          const layout = layoutById.get(node.id);
          const parentWidth =
            nodeById.get(node.parentNode)?.data?.pageWidth ??
            layout?.width ??
            node.data?.width;
          return {
            ...node,
            position: { x: 0, y: layout?.y ?? 0 },
            style: {
              ...node.style,
              width: parentWidth,
            },
          };
        }
        if (node.data?.positionMode === "flow") {
          // Flow-positioned nodes use resolver-computed render coordinates.
          const flowPos = getFlowRenderPosition(node) as any;
          return {
            ...node,
            position: {
              x: flowPos?.x ?? node.position?.x ?? 0,
              y: flowPos?.y ?? node.position?.y ?? 0,
            },
          };
        }
        return node;
      }),
    [inspectorSelection, nodeById, layoutById, getFlowRenderPosition]
  );

  // Menu and viewport controls.
  const onNavigateHome = useCallback(() => navigate("/"), [navigate]);
  const onNavigateDashboard = useCallback(
    () => navigate("/dashboard"),
    [navigate]
  );
  const onToggleGrid = useCallback(
    () => setShowGrid((prev: boolean) => !prev),
    [setShowGrid]
  );
  const onZoomIn = useCallback(() => reactFlowInstance.zoomIn(), [reactFlowInstance]);
  const onZoomOut = useCallback(
    () => reactFlowInstance.zoomOut(),
    [reactFlowInstance]
  );
  const onZoomToFit = useCallback(
    () => reactFlowInstance.fitView({ padding: 0.2, duration: 200 }),
    [reactFlowInstance]
  );

  // Layer panel handlers.
  const handleLayerNodeSelect = useCallback(
    (node: any) => {
      // Keep row click behavior consistent with canvas: select parent frame instead.
      if (shouldRedirectRowSelection(node.type as string)) {
        const parentSection = nodeById.get(node.parentNode);
        if (parentSection?.type === "section") {
          selectSectionWithBars(parentSection);
        }
        return;
      }
      // Selecting a section from layer panel should include bundled bars.
      if (node.type === "section") {
        selectSectionWithBars(node);
        return;
      }
      setSelectedNode(node);
      setSelectedNodes([node]);
    },
    [nodeById, selectSectionWithBars, setSelectedNode, setSelectedNodes]
  );

  const handleLayerNodeDelete = useCallback(
    (nodeId: string) => {
      const target = nodeById.get(nodeId);
      // Structural frame is protected from direct delete in layer panel.
      if (target?.type === "section") return;
      if (target?.type === "row") {
        // Row deletion must also remove row-owned children and row references.
        setNodesNormalized((nds: any) =>
          nds.filter(
            (n: any) =>
              n.id !== nodeId && n.parentNode !== nodeId && n.data?._rowId !== nodeId
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
    },
    [nodeById, selectedNode, setNodesNormalized, setSelectedNode, setSelectedNodes]
  );

  const handleLayerUpdateNode = useCallback(
    (nodeId: string, updates: any) => {
      // Visibility/lock toggles are persisted in node.data.
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
    },
    [setNodesNormalized]
  );

  const handleLayerReorderNodes = useCallback(
    (nodeId: string, targetIndex: number) => {
      // Layer panel reorders by mutating data.order; z-index normalization occurs elsewhere.
      setNodesNormalized((nds: any) => {
        const nodesCopy = [...nds];
        const draggedIndex = nodesCopy.findIndex((n) => n.id === nodeId);
        if (draggedIndex === -1) return nds;

        const [draggedNode] = nodesCopy.splice(draggedIndex, 1);
        nodesCopy.splice(targetIndex, 0, draggedNode);

        return nodesCopy.map((node, index) => ({
          ...node,
          data: {
            ...node.data,
            order: index,
          },
        }));
      });
    },
    [setNodesNormalized]
  );

  // Canvas interaction handlers.
  const handleCanvasNodeClick = useCallback(
    (event: any, node: any) => {
      // Mirror layer-panel row redirect behavior on canvas clicks.
      if (shouldRedirectRowSelection(node.type as string)) {
        const parentSection = nodeById.get(node.parentNode);
        if (parentSection?.type === "section") {
          selectSectionWithBars(parentSection);
        }
        return;
      }
      // Section click uses bundled selection for frame-level tools.
      if (node.type === "section") {
        event.stopPropagation();
        selectSectionWithBars(node);
        return;
      }
      event.stopPropagation();
      // In placement mode, click places the pending node instead of selecting target.
      if (placementMode) {
        placeNodeAtEvent(event);
        return;
      }
      setSelectedNode(node);
      setSelectedNodes([node]);
    },
    [
      nodeById,
      selectSectionWithBars,
      placementMode,
      placeNodeAtEvent,
      setSelectedNode,
      setSelectedNodes,
    ]
  );

  const handleCanvasNodeDragStart = useCallback(
    (_event: any, node: any) => {
      if (shouldRedirectRowSelection(node.type as string)) return;
      if (node.type === "section") {
        selectSectionWithBars(node);
        return;
      }
      setSelectedNode(node);
      setSelectedNodes([node]);
    },
    [selectSectionWithBars, setSelectedNode, setSelectedNodes]
  );

  const handleCanvasNodeDrag = useCallback(
    (event: any, node: any) => {
      if (!node) return;
      handleNodeDrag(event, node);
      // Smart guides are opt-in by policy based on node type/state.
      if (shouldUseSmartGuides(node)) {
        handleGuideDrag(node);
      }
    },
    [handleNodeDrag, handleGuideDrag]
  );

  const handleCanvasNodeDragStop = useCallback(
    (event: any, node: any) => {
      if (!node) return;
      handleNodeDragStop(event, node);
      clearGuides();
    },
    [handleNodeDragStop, clearGuides]
  );

  const handleCanvasPaneClick = useCallback(
    (event: any) => {
      if (placementMode) {
        // Empty-pane click becomes placement action while in placement mode.
        placeNodeAtEvent(event);
        return;
      }
      // If click does not resolve to frame hit-testing, clear selection.
      if (!selectFrameAtPoint(event)) {
        setSelectedNode(null);
        setSelectedNodes([]);
      }
    },
    [placementMode, placeNodeAtEvent, selectFrameAtPoint, setSelectedNode, setSelectedNodes]
  );

  // Toolbar placement/drawing mode toggle.
  const handleAddToolbarNode = useCallback(
    (type: string, label: string) => {
      // Shape/container use draw-to-size mode; others use click-to-place mode.
      if (type === "shape" || type === "container") {
        setDrawingMode({ type, label, start: { x: 0, y: 0 } });
      } else {
        setPlacementMode({ type, label });
      }
    },
    [setDrawingMode, setPlacementMode]
  );

  // Inspector handlers keep selected snapshots in sync with node updates.
  const updateInspectorNode = useCallback(
    (id: string, updates: any) => {
      const shouldRefreshSize =
        updates?.width !== undefined || updates?.height !== undefined;
      setNodesNormalized((nds: any) => {
        const updatedNodes = nds.map((n: any) => {
          if (n.id === id) {
            const { height, ...otherUpdates } = updates;
            return {
              ...n,
              data: {
                ...n.data,
                ...otherUpdates,
                // Keep style.height as source of truth when explicit height is changed.
                ...(height !== undefined ? { height: undefined } : {}),
              },
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

        setSelectedNodes((prev) =>
          prev.map((sn) => {
            const updated = updatedNodes.find((n: any) => n.id === sn.id);
            return updated || sn;
          })
        );

        return updatedNodes;
      });

      if (shouldRefreshSize) {
        // Required so ReactFlow recomputes handles/bounds after size writes.
        refreshNodeInternals(id);
      }
    },
    [setNodesNormalized, setSelectedNodes, refreshNodeInternals]
  );

  const updateInspectorNodes = useCallback(
    (ids: string[], updates: any) => {
      setNodesNormalized((nds: any) => {
        const { __addNode, ...restUpdates } = updates || {};
        if (__addNode) {
          // Inspector can request appending a node in bulk-update path.
          return [...nds, __addNode];
        }

        const { height, ...otherUpdates } = restUpdates;

        const updatedNodes = nds.map((n: any) => {
          if (ids.includes(n.id)) {
            return {
              ...n,
              data: {
                ...n.data,
                ...otherUpdates,
                // Keep style.height as source of truth when explicit height is changed.
                ...(height !== undefined ? { height: undefined } : {}),
              },
              position:
                restUpdates.position !== undefined ? restUpdates.position : n.position,
              style: {
                ...n.style,
                ...(restUpdates.width !== undefined
                  ? { width: restUpdates.width }
                  : {}),
                ...(restUpdates.height !== undefined
                  ? { height: restUpdates.height }
                  : {}),
              },
            };
          }
          return n;
        });

        setSelectedNodes((prev) =>
          prev.map((sn) => {
            const updated = updatedNodes.find((n: any) => n.id === sn.id);
            return updated || sn;
          })
        );

        if (
          restUpdates?.width !== undefined ||
          restUpdates?.height !== undefined
        ) {
          // Refresh all touched nodes when dimensions change.
          refreshNodeInternals(ids);
        }

        return updatedNodes;
      });
    },
    [setNodesNormalized, setSelectedNodes, refreshNodeInternals]
  );

  const deleteInspectorNode = useCallback(
    (id: string) => {
      setNodesNormalized((nds: any) => nds.filter((n: any) => n.id !== id));
      setSelectedNodes([]);
      setSelectedNode(null);
    },
    [setNodesNormalized, setSelectedNodes, setSelectedNode]
  );

  const deleteInspectorNodes = useCallback(
    (ids: string[]) => {
      setNodesNormalized((nds: any) => nds.filter((n: any) => !ids.includes(n.id)));
      setSelectedNodes([]);
      setSelectedNode(null);
    },
    [setNodesNormalized, setSelectedNodes, setSelectedNode]
  );

  const closeInspector = useCallback(() => {
    setSelectedNodes([]);
    setSelectedNode(null);
  }, [setSelectedNodes, setSelectedNode]);

  // ReactFlow behavior/style values consumed in JSX.
  const canDragCanvas = useMemo(
    () =>
      allowCanvasDrag({
        drawingMode,
        isResizing,
        isEditingRadius,
      }),
    [drawingMode, isResizing, isEditingRadius]
  );

  const canvasCursor = placementMode || drawingMode ? "crosshair" : "default";
  const reactFlowStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      cursor: canvasCursor,
    }),
    [canvasCursor]
  );

  const handleAddFrame = useCallback(() => addNode("section", "Frame"), [addNode]);

  // Return shape intentionally mirrors UI component prop contracts in PageBuilderInner.
  return {
    normalizedLayerNodes,
    isSectionBundle,
    inspectorPanelSelectedNodes,
    onNavigateHome,
    onNavigateDashboard,
    onToggleGrid,
    onZoomIn,
    onZoomOut,
    onZoomToFit,
    handleLayerNodeSelect,
    handleLayerNodeDelete,
    handleLayerUpdateNode,
    handleLayerReorderNodes,
    handleCanvasNodeClick,
    handleCanvasNodeDragStart,
    handleCanvasNodeDrag,
    handleCanvasNodeDragStop,
    handleCanvasPaneClick,
    handleAddToolbarNode,
    updateInspectorNode,
    updateInspectorNodes,
    deleteInspectorNode,
    deleteInspectorNodes,
    closeInspector,
    canDragCanvas,
    reactFlowStyle,
    handleAddFrame,
  };
}
