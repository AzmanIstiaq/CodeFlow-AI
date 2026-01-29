/**
 * RULE BOUNDARY
 *
 * This file must not define layout, spacing, drag, resize,
 * selection, or z-index rules.
 *
 * All such logic MUST come from frontendRules/*.
 * Ownership quick map: spacing/height → layout/*; flow/columns → flow/*; drag/guides → interaction/*; resize → resize/*; selection → selection/*; z-index → layering/*; inspector → inspector/*; export/layout safety → export/*.
 */
/**
 * PageBuilderInner Component
 *
 * The core canvas editor for the visual page builder.
 * Orchestrates all builder features: nodes, guides, layers, undo/redo, snapping, etc.
 *
 * Architecture:
 * - Uses React hooks for state and side effects
 * - Leverages ReactFlow for canvas rendering and drag handling
 * - Integrates custom hooks for domain logic (site state, node ops, guides, etc.)
 * - Manages multi-page sites with immutable state updates
 *
 * Key Responsibilities:
 * 1. Render ReactFlow canvas with all node types
 * 2. Handle node/edge changes and state synchronization
 * 3. Coordinate between multiple feature hooks (undo, guides, columns, etc.)
 * 4. Manage keyboard shortcuts and interaction states
 * 5. Persist changes to server via API
 * 6. Support drawing mode, resizing, radius editing
 * 7. Maintain visual feedback (guides, layers, inspector)
 *
 * State Management:
 * - useSiteState: Multi-page site + active page
 * - useNodeOperations: Node/edge change handlers
 * - useColumnDropZones: Column-based layout system
 * - useSmartGuides: Alignment and snapping
 * - useHistory: Undo/redo
 * - Local state: Drawing, resizing, selection, etc.
 *
 * Performance Optimizations:
 * - Node types defined outside component (referential equality)
 * - useCallback for expensive handlers
 * - useMemo for transformation pipelines
 * - Ref-based refs for drawing/resizing state
 *
 * Constants:
 * - MODE: "builder" (AI execution disabled)
 * - nodeTypes: Maps node type strings to React components
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useReactFlow, useViewport } from "reactflow";
import ReactFlow, { type NodeTypes } from "reactflow";
import type { Node as ReactFlowNode } from "reactflow";
import "reactflow/dist/style.css";
import "../styles/reactflow-overrides.css";
import { ArrowRight, Plus } from "lucide-react";

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
import HeaderFooterNode from "../components/builder/Nodes/HeaderFooterNode";
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
import { exportNextJSZip } from "../utils/exportNextJsZip";
import { normalizeZIndex } from "../frontendRules/layering/layeringResolvers";
import {
  computeAbsolutePosition,
  computeLayoutMaps,
  computeFlowStackOffsets,
  getFlowRenderPosition as resolveFlowRenderPosition,
} from "../frontendRules/layout/layoutResolvers";
import { isBarNode } from "../frontendRules/layout/layoutPolicy";
import {
  isNodeDraggable,
  shouldUseSmartGuides,
} from "../frontendRules/interaction/interactionPolicy";
import {
  allowCanvasDrag,
  getMultiSelectKey,
} from "../frontendRules/interaction/interactionResolvers";
import {
  bundleSectionSelection,
  deriveInspectorSelection,
  isPointInsideFrame,
} from "../frontendRules/selection/selectionResolvers";
import { shouldRedirectRowSelection } from "../frontendRules/selection/selectionPolicy";
import {
  resolveBarResizeState,
  resolveContentResizeState,
} from "../frontendRules/resize/resizeResolvers";
import { canExportSite } from "../frontendRules/export/exportPolicy";

// ===== APPLICATION MODE =====
// "workflow" enables AI execution; "builder" is page design only
const MODE: "workflow" | "builder" = "builder";

// ===== NODE TYPE REGISTRY =====
// Maps node type strings to React components
// Defined outside component to preserve referential equality across renders
// Static nodeTypes - defined ONCE outside component (referential equality preserved)
const nodeTypes: NodeTypes = {
  start: StartNode,
  ai: AINode,
  output: OutputNode,
  text: TextNode as any,
  section: SectionNode,
  row: RowNode,
  header: HeaderFooterNode,
  footer: HeaderFooterNode,
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

// ===== UTILITY FUNCTIONS =====

/**
 * Get default data for each node type
 * Provides reasonable starting values for new nodes
 */
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
        positionMode: "flow",
      };
    case "button":
      return {
        label: "Click Me",
        href: "#",
        variant: "primary",
        borderRadius: 8,
        opacity: 1,
        rotation: 0,
        positionMode: "flow",
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
        positionMode: "flow",
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
        positionMode: "flow",
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
        positionMode: "flow",
      };
    case "formInput":
      return {
        placeholder: "Enter text...",
        inputType: "text",
        width: 300,
        fontSize: 14,
        padding: 10,
        required: false,
        positionMode: "flow",
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
        positionMode: "flow",
      };
    case "section":
      return {
        label,
        padding: 40,
        gap: 24,
        align: "start",
        maxWidth: 1200,
        backgroundColor: "#000000",
        positionMode: "flow",
        syncHeaderFooterStyle: true,
      };
    case "header":
      return {
        label: "Header",
        height: 80,
        padding: 0,
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        columns: { count: 3, gap: 0 },
        positionMode: "absolute",
      };
    case "footer":
      return {
        label: "Footer",
        height: 80,
        padding: 0,
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        columns: { count: 3, gap: 0 },
        positionMode: "absolute",
      };
    default:
      return { label };
  }
};

export default function PageBuilderInner() {
  // =====================================
  // URL PARAMETERS
  // =====================================
  // Get workflow ID from URL query string for persistence
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  // =====================================
  // LOCAL STATE
  // =====================================
  // Node selection
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<ReactFlowNode[]>([]);

  // Clipboard for copy/paste operations
  const [clipboard, setClipboard] = useState<any[]>([]);

  // UI visibility flags
  const [showGrid, setShowGrid] = useState(false);
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  // Node placement mode (toolbar button â click canvas to place)
  const [placementMode, setPlacementMode] = useState<{
    type: string;
    label: string;
  } | null>(null);

  // Canvas drawing mode (ESC key to start free drawing)
  const [drawingMode, setDrawingMode] = useState<{
    type: string;
    label: string;
    start: { x: number; y: number };
  } | null>(null);

  // Visual preview while drawing
  const [drawingPreview, setDrawingPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Ref to track drawing state without re-rendering
  const isDrawingRef = useRef(false);

  // UI state for interactions
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingRadius, setIsEditingRadius] = useState(false);

  // =====================================
  // HOOK INTEGRATION
  // =====================================
  // Clean hook-based architecture for domain logic separation
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

  // Centralized node setter keeps z-index canonical so rows/sections sit beneath content.
  // This wrapper ensures every hook mutation flows through the same layering guardrail.
  // Column extent + flow math expect normalized order, so avoid bypassing this setter.
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
    addNodeToColumn,
    removeNodeFromColumn,
    handleMoveEnd,
    handleNodeDrag,
    handleNodeDragStop,
    viewportVersion,
    hoverState,
    findDropTarget,
  } = useColumnDropZones(nodes, setNodesNormalized);

  const hasFrame = nodes.some((n: any) => n.type === "section");

  const { save, dialogProps } = useWorkflowOperations(
    id,
    site,
    activePage,
    setNodesNormalized
  );

  const handleExportNextJSZip = () => {
    // Export uses the static Next.js scaffold so layout math stays precomputed at build time.
    // Keep this call thin to avoid touching canvas state while the archive is generated.
    if (canExportSite(site)) {
      exportNextJSZip(site as any);
    }
  };

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

  const prevPositionModeRef = useRef(new Map<string, string>());

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

  // Reconcile mode transitions between absolute and flow layouts.
  useEffect(() => {
    const prev = prevPositionModeRef.current;

    nodes.forEach((n: any) => {
      if (!n || n.type === "section" || n.type === "row") return;
      const currentMode = n.data?.positionMode ?? "absolute";
      const prevMode = prev.get(n.id);

      if (
        prevMode === undefined &&
        currentMode === "flow" &&
        n.data?._ownedByColumn !== undefined &&
        n.data?._columnIndex !== undefined
      ) {
        prev.set(n.id, currentMode);
        return;
      }

      if (prevMode === currentMode) {
        return;
      }

      if (currentMode === "flow") {
        if (
          n.data?._ownedByColumn !== undefined &&
          n.data?._columnIndex !== undefined
        ) {
          prev.set(n.id, currentMode);
          return;
        }

        const absX = n.positionAbsolute?.x ?? n.position?.x;
        const absY = n.positionAbsolute?.y ?? n.position?.y;
        const width =
          (n.style?.width as number | undefined) ??
          (n.width as number | undefined) ??
          (n.data?.width as number | undefined) ??
          0;
        const height =
          (n.style?.height as number | undefined) ??
          (n.height as number | undefined) ??
          (n.data?.height as number | undefined) ??
          0;
        const centerPoint =
          absX !== undefined && absY !== undefined
            ? { x: absX + width / 2, y: absY + height / 2 }
            : null;
        const target = centerPoint ? findDropTarget(centerPoint) : null;
        if (target) {
          addNodeToColumn(target.ownerId, n.id, target.columnIndex, centerPoint || undefined);
        }
      } else if (currentMode === "absolute" && n.data?._ownedByColumn) {
        const point = n.positionAbsolute
          ? { x: n.positionAbsolute.x, y: n.positionAbsolute.y }
          : n.position;
        removeNodeFromColumn(n.id, point);
      }

      prev.set(n.id, currentMode);
    });
  }, [nodes, addNodeToColumn, removeNodeFromColumn, findDropTarget]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedNodes:
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
          ? [selectedNode]
          : [],
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onSelectAll: handleSelectAll,
    onDeselect: handleDeselect,
  });

  const hasSelection = selectedNodes.length > 0 || selectedNode !== null;

  const selectSectionWithBars = useCallback(
    (sectionNode: any) => {
      const bundled = bundleSectionSelection(nodes, sectionNode);
      setSelectedNode(sectionNode);
      setSelectedNodes(bundled);
    },
    [nodes]
  );

  // Inspector should focus on the frame when frame + bars are bundled.
  const inspectorSelection = useMemo(() => {
    return deriveInspectorSelection(selectedNodes);
  }, [selectedNodes]);

  // IMPORTANT:
  // Layout rules are centralized in frontendRules/layout.
  // Do NOT modify spacing or coordinate logic here.
  const getAbsolutePosition = useCallback(
    (nodeId: string | undefined | null) => computeAbsolutePosition(nodeId, nodes),
    [nodes]
  );

  // IMPORTANT:
  // Layout rules are centralized in frontendRules/layout.
  // Do NOT modify spacing or stacking logic here.
  const { layoutById, sectionHeightById } = useMemo(
    () => computeLayoutMaps(nodes),
    [nodes]
  );

  // Force ReactFlow to recalc node dimensions when we update size programmatically
  const refreshNodeInternals = useCallback(
    (ids: string | string[]) => {
      const updateInternals = (reactFlowInstance as any)?.updateNodeInternals;
      if (typeof updateInternals !== "function") return;
      const list = Array.isArray(ids) ? ids : [ids];
      list.forEach((nodeId) =>
        requestAnimationFrame(() => updateInternals(nodeId))
      );
    },
    [reactFlowInstance]
  );

  // =====================================
  // NODE PLACEMENT & INTERACTION HANDLERS
  // =====================================
  /**
   * Place node at mouse click location
   * Respects column drop zones if available
   * Centers node on cursor
   */
  const placeNodeAtEvent = useCallback(
    (event: any) => {
      if (!placementMode) return false;
      const defaultData = getDefaultNodeData(
        placementMode.type,
        placementMode.label
      );
      const width =
        (defaultData.width as number | undefined) ??
        (defaultData as any)?.style?.width ??
        0;
      const height =
        (defaultData.height as number | undefined) ??
        (defaultData as any)?.style?.height ??
        0;
      const flowPoint = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const target = findDropTarget(flowPoint);

      let position, parentNode, extraData: any = {};

      const isBar = isBarNode(placementMode.type);
      const frame = nodes.find((n) => n.type === "section");

      if (isBar) {
        if (!frame) {
          alert("Add a Frame first.");
          return false;
        }
        const alreadyExists = nodes.some(
          (n) => n.type === placementMode.type && n.parentNode === frame.id
        );
        if (alreadyExists) {
          setPlacementMode(null);
          return false;
        }
        parentNode = frame.id;
        position = { x: 0, y: 0 };
        extraData.order =
          placementMode.type === "header" ? -1000 : Number.MAX_SAFE_INTEGER;
      } else if (!target) {
        position = {
          x: flowPoint.x - width / 2,
          y: flowPoint.y - height / 2,
        };
        parentNode = undefined;
      } else {
        const { ownerId, columnIndex } = target;
        parentNode = ownerId;
        if (defaultData.positionMode === "flow") {
          extraData = {
            ...extraData,
            _rowId: ownerId,
            _ownedByColumn: ownerId,
            _columnIndex: columnIndex,
            columnIndex,
          };
          const siblings = nodes
            .filter(
              (n: any) =>
                n.data?._ownedByColumn === ownerId &&
                n.data?._columnIndex === columnIndex
            )
            .sort((a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0));
          extraData.order = siblings.length;
          position = { x: 0, y: 0 };
        } else {
          const parentAbs = getAbsolutePosition(ownerId);
          const colRect =
            (target as any)?.rect ??
            null;
          if (colRect) {
            position = {
              x: flowPoint.x - width / 2 - colRect.left,
              y: flowPoint.y - height / 2 - colRect.top,
            };
          } else {
            position = {
              x: flowPoint.x - width / 2 - parentAbs.x,
              y: flowPoint.y - height / 2 - parentAbs.y,
            };
          }
        }
      }

      if (defaultData.positionMode === "flow") {
        if (!parentNode) return false;

        const parent = nodes.find((n) => n.id === parentNode);
        if (!parent || parent.type !== "row") return false;
      }

      const nodeId = `${placementMode.type}-${Date.now()}`;

      const newNode: any = {
        id: nodeId,
        type: placementMode.type,
        parentNode: parentNode,
        position: position,
        draggable: isBar ? false : defaultData.positionMode === "absolute",
        style: defaultData.width
          ? {
              width:
                isBar && frame
                  ? frame.data?.pageWidth ??
                    frame.data?.maxWidth ??
                    defaultData.width
                  : defaultData.width,
              ...(defaultData.height ? { height: defaultData.height } : {}),
            }
          : undefined,
        data: {
          ...defaultData,
          ...extraData,
        },
      };

      setNodesNormalized((nds: any) => [...nds, newNode]);
      setPlacementMode(null);
      setSelectedNode(newNode);
      setSelectedNodes([newNode]);
      return true;
    },
    [placementMode, reactFlowInstance, findDropTarget, setNodesNormalized, nodes, getAbsolutePosition]
  );

  // Lets the pane click-through pick the frame when clicking empty space inside it.
  // Coordinates stay in flow space, so section bounds guard against accidental off-canvas selection.
  // Keeps selection lifecycle predictable when toggling between placement and drag interactions.
  const selectFrameAtPoint = useCallback(
    (event: any) => {
      const flowPoint = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const frame = nodes.find((n: any) => n.type === "section");
      if (!frame) return false;
      const height =
        sectionHeightById.get(frame.id) ??
        frame.height ??
        frame.data?.pageHeight ??
        0;
      if (isPointInsideFrame(flowPoint, frame, height)) {
        selectSectionWithBars(frame);
        return true;
      }
      return false;
    },
    [nodes, reactFlowInstance, sectionHeightById, selectSectionWithBars]
  );

  // IMPORTANT:
  // Flow stacking rules are centralized in frontendRules/layout.
  // Do NOT modify flow offset logic here.
  const flowStackOffsets = useMemo(
    () => computeFlowStackOffsets(nodes),
    [nodes]
  );

  const getFlowRenderPosition = useCallback(
    (node: any) =>
      resolveFlowRenderPosition(node, flowStackOffsets, nodes, layoutById),
    [flowStackOffsets, nodes, layoutById]
  );

  // Project builder nodes into ReactFlow props while preserving flow/absolute intent and layering.
  // Ordering and z-index normalization here must stay stable or selection/extent math drifts.
  // Keep this pure so downstream hooks can trust node data remains untouched during render.
  // IMPORTANT:
  // Drag, resize, and layering rules are centralized in frontendRules/interaction, frontendRules/resize, and frontendRules/layering.
  // Do NOT modify rule logic here.
  const transformedNodes = useMemo(() => {
    return (
      nodes
        // Render order must respect zIndex to keep rows below content nodes.
        .filter((n: any) => !n.data?.hidden)
        .sort((a: any, b: any) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((n: any) => {
          const isSelected =
            selectedNode?.id === n.id ||
            selectedNodes.some((sn) => sn.id === n.id);
          if (n.type === "section") {
            const computedHeight = sectionHeightById.get(n.id);
            // Prioritize manual height settings over computed height
            const manualHeight = 
              (n.style?.height as number | undefined) ?? 
              (n.height as number | undefined) ??
              (n.data?.pageHeight as number | undefined);
            
            return {
              ...n,
              zIndex: 0,
              draggable: false,
              selected: isSelected,
              data: {
                ...n.data,
                _computedHeight: computedHeight,
                _allNodes: nodes,
                _registerColumnRect: registerColumnRect,
                _viewportVersion: viewportVersion,
                _hoverState: hoverState,
              },
              style: {
                ...n.style,
                zIndex: 0,
                ...(manualHeight ? { height: manualHeight } : (computedHeight ? { height: computedHeight } : {})),
              },
            };
          }
          if (n.type === "row") {
            const layout = layoutById.get(n.id);
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
                    (node: any) =>
                      node.type === "section" && node.id === n.parentNode
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
          if (n.type === "header" || n.type === "footer") {
            const layout = layoutById.get(n.id);
            const layoutWidth =
              layout?.width ??
              n.style?.width ??
              n.data?.width ??
              (nodes.find((p: any) => p.id === n.parentNode)?.data?.pageWidth ??
                undefined);
            const renderHeight =
              (typeof n.data?.height === "number" && n.data.height > 0
                ? n.data.height
                : undefined) ??
              (typeof n.style?.height === "number" && n.style.height > 0
                ? n.style.height
                : undefined) ??
              layout?.height ??
              (n.type === "header" ? 120 : 140);
            const parentSelected = selectedNodes.some(
              (sn) => sn.type === "section" && sn.id === n.parentNode
            );
            const selfSelected =
              isSelected && selectedNodes.length <= 1 && !parentSelected;
            return {
              ...n,
              zIndex: 1,
              draggable: isNodeDraggable({
                node: n,
                isFlow: false,
                baseDraggable: n.draggable !== false,
                isSelected,
              }),
              position: layout ? { x: layout.x, y: layout.y } : n.position,
              selected: isSelected,
              data: {
                ...n.data,
                _allNodes: nodes,
                _registerColumnRect: registerColumnRect,
                _viewportVersion: viewportVersion,
                _hoverState: hoverState,
                // SOURCE OF TRUTH: _measuredHeight is written only via layoutResolvers measurement callback.
                _onMeasure: (id: string, height: number) => {
                  setNodesNormalized((nds: any) =>
                    nds.map((node: any) => {
                      if (node.id !== id) return node;
                      if (typeof node.data?.height === "number") return node;
                      if (node.data?._measuredHeight === height) return node;
                      return {
                        ...node,
                        data: {
                          ...node.data,
                          _measuredHeight: height,
                        },
                      };
                    })
                  );
                },
                _onColumnClick: (event: any) => {
                  if (placementMode) {
                    placeNodeAtEvent(event);
                    return;
                  }
                  setSelectedNode(n);
                  setSelectedNodes([n]);
                },
                _onResizeStart: () => setIsResizing(true),
                _onResizeEnd: () => setIsResizing(false),
                _onResize: (_event: any, params: any) => {
                  const { nextWidth, nextHeight, nextPosition } =
                    resolveBarResizeState(n, params, layoutWidth, layout?.y);

                  // Persist size into both style and data so layout + inspector stay in sync.
                  setNodesNormalized((nds: any) =>
                    nds.map((node: any) =>
                      node.id === n.id
                        ? {
                            ...node,
                            width: nextWidth,
                            height: nextHeight,
                            position: nextPosition,
                            style: {
                              ...node.style,
                              width: nextWidth,
                              height: nextHeight,
                              zIndex: n.zIndex ?? 10,
                            },
                            data: {
                              ...node.data,
                              width: nextWidth,
                              height: nextHeight,
                              _lastResize: Date.now(),
                            },
                          }
                        : node
                    )
                  );

                  // Keep the inspector's selected node snapshot fresh.
                  setSelectedNodes((prev) =>
                    prev.map((sn) =>
                      sn.id === n.id
                        ? {
                            ...sn,
                            width: nextWidth,
                            height: nextHeight,
                            style: {
                              ...sn.style,
                              width: nextWidth,
                              height: nextHeight,
                            },
                            data: {
                              ...sn.data,
                              width: nextWidth,
                              height: nextHeight,
                            },
                          }
                        : sn
                    )
                  );

                  // Force ReactFlow to recalc internals so the new size is applied on canvas.
                  const updateInternals = (reactFlowInstance as any)?.updateNodeInternals;
                  if (typeof updateInternals === "function") {
                    requestAnimationFrame(() => updateInternals(n.id));
                  }
                },
              },
              style: {
                ...n.style,
                zIndex: 1,
                width: layoutWidth,
                minHeight: undefined,
                height: renderHeight,
                outline: undefined,
                outlineOffset: undefined,
                boxShadow:
                  parentSelected || selfSelected
                    ? parentSelected
                      ? "inset 0 0 0 2px #3b82f6"
                      : "0 0 0 2px #3b82f6"
                    : undefined,
                marginTop: parentSelected ? -2 : 0,
                marginBottom: parentSelected ? -2 : 0,
                boxSizing: "border-box",
              },
            };
          }
          const isFlow = n.data?.positionMode === "flow";
          const baseDraggable = n.draggable !== false;
          const flowY = flowStackOffsets.get(n.id);
          let flowX = 0;
          if (
            isFlow &&
            n.data?._columnIndex !== undefined &&
            n.data?._ownedByColumn
          ) {
            const owner = nodes.find(
              (node: any) => node.id === n.data?._ownedByColumn
            );
            const ownerLayout = layoutById.get(n.data?._ownedByColumn);
            const ownerWidth =
              ownerLayout?.width ??
              owner?.style?.width ??
              owner?.width ??
              owner?.data?.width ??
              0;
            const columnCount =
              owner?.data?.columns?.count ??
              owner?.data?.columns ??
              1;
            if (ownerWidth && columnCount > 0) {
              flowX = (ownerWidth / columnCount) * n.data._columnIndex;
            }
          }

          return {
            ...n,
            selected: isSelected,
            draggable: isNodeDraggable({
              node: n,
              isFlow,
              baseDraggable,
              isSelected,
            }),
            position: isFlow
              ? {
                  x: flowX,
                  y: flowY ?? n.position.y ?? 0,
                }
              : n.position,
            data: {
              ...n.data,
              _onResizeStart: () => setIsResizing(true),
              _onResizeEnd: () => setIsResizing(false),
              _onRadiusStart: () => setIsEditingRadius(true),
              _onRadiusEnd: () => setIsEditingRadius(false),
              _onResize: (_event: any, params: any) => {
                const { nextWidth, nextHeight, nextPosition } =
                  resolveContentResizeState(n, params);
                setNodesNormalized((nds: any) =>
                  nds.map((node: any) =>
                    node.id === n.id
                      ? {
                          ...node,
                          ...(nextPosition ? { position: nextPosition } : {}),
                          style: {
                            ...node.style,
                            width: nextWidth,
                            height: nextHeight,
                            zIndex: n.zIndex ?? 10,
                          },
                          data: {
                            ...node.data,
                            width: Math.round(nextWidth),
                            height: Math.round(nextHeight),
                          },
                        }
                      : node
                  )
                );

                // Ensure ReactFlow refreshes measured bounds after resize.
                const updateInternals = (reactFlowInstance as any)?.updateNodeInternals;
                if (typeof updateInternals === "function") {
                  requestAnimationFrame(() => updateInternals(n.id));
                }
              },
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
                          ...(node.type === "formInput"
                            ? { placeholder: newText }
                            : {}),
                        },
                      };
                    }
                    return node;
                  })
                );
              },
              _onRadiusChange: (radius: number, corner?: string) => {
                setNodesNormalized((nds: any) =>
                  nds.map((node: any) => {
                    if (node.id !== n.id) return node;

                    if (corner) {
                      // Individual corner editing (Ctrl pressed)
                      const currentRadius =
                        typeof node.data.borderRadius === "number"
                          ? {
                              topLeft: node.data.borderRadius,
                              topRight: node.data.borderRadius,
                              bottomLeft: node.data.borderRadius,
                              bottomRight: node.data.borderRadius,
                            }
                          : {
                              topLeft: 0,
                              topRight: 0,
                              bottomLeft: 0,
                              bottomRight: 0,
                              ...node.data.borderRadius,
                            };

                      return {
                        ...node,
                        data: {
                          ...node.data,
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
        })
    );
  }, [
    nodes,
    selectedNode,
    selectedNodes,
    sectionHeightById,
    layoutById,
    registerColumnRect,
    viewportVersion,
    hoverState,
    placementMode,
    setNodesNormalized,
    setNodes,
    placeNodeAtEvent,
    flowStackOffsets,
  ]);

  // =====================================
  // JSX RENDER
  // =====================================
  // Main UI structure with ReactFlow canvas and surrounding panels
  return (
    <>
      <SaveWorkflowDialog {...dialogProps} />
      <MenuBar
        onSave={save}
        onExportNextJSZip={handleExportNextJSZip}
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
        onZoomToFit={() =>
          reactFlowInstance.fitView({ padding: 0.2, duration: 200 })
        }
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
          visible={
            hasFrame && (selectedNodes.length > 0 || selectedNode !== null)
          }
        />
        {hasFrame && (
          <LayerPanel
            nodes={normalizeZIndex(nodes)}
            selectedNode={selectedNode}
            onNodeSelect={(node) => {
              if (shouldRedirectRowSelection(node.type as string)) {
                const parentSection = nodes.find(
                  (n: any) => n.type === "section" && n.id === node.parentNode
                );
                if (parentSection) {
                  selectSectionWithBars(parentSection);
                }
                return;
              }
              if (node.type === "section") {
                selectSectionWithBars(node);
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
              setNodesNormalized((nds: any) =>
                nds.filter((n: any) => n.id !== nodeId)
              );
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
                const draggedIndex = nodesCopy.findIndex(
                  (n) => n.id === nodeId
                );
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
            <div
              style={{
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
              }}
            >
              Click on canvas to place {placementMode.label}{" "}
              <ArrowRight size={14} aria-hidden="true" /> Press ESC to cancel
            </div>
          )}
          {drawingMode && (
            <div
              style={{
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
              }}
            >
              Click and drag to draw {drawingMode.label}{" "}
              <ArrowRight size={14} aria-hidden="true" /> Press ESC to cancel
            </div>
          )}
          <NodeToolbar
            addNode={(type, label) => {
              // Use drawing mode for shapes and containers
              if (type === "shape" || type === "container") {
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
                <Plus size={16} aria-hidden="true" /> Add Frame
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
              <ZoomControls
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}
              />
              <ReactFlow
                nodes={transformedNodes}
                edges={MODE === "builder" ? [] : edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onNodeClick={(event, node) => {
                  if (shouldRedirectRowSelection(node.type as string)) {
                    const parentSection = nodes.find(
                      (n: any) =>
                        n.type === "section" && n.id === node.parentNode
                    );
                    if (parentSection) {
                      selectSectionWithBars(parentSection);
                    }
                    return;
                  }
                  if (node.type === "section") {
                    event.stopPropagation();
                    selectSectionWithBars(node);
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
                nodesDraggable={allowCanvasDrag({
                  drawingMode,
                  isResizing,
                  isEditingRadius,
                })}
                elementsSelectable={!drawingMode}
                selectNodesOnDrag={true}
                elevateNodesOnSelect={false}
                panOnDrag={drawingMode ? false : true}
                zoomOnScroll={!drawingMode}
                onNodeDragStart={(_, node) => {
                  if (shouldRedirectRowSelection(node.type as string)) return;
                  if (node.type === "section") {
                    selectSectionWithBars(node);
                    return;
                  }
                  setSelectedNode(node);
                  setSelectedNodes([node]);
                }}
                onNodeDrag={(event, node) => {
                  if (!node) return;

                  handleNodeDrag(event, node);
                  if (shouldUseSmartGuides(node)) {
                    handleGuideDrag(node);
                  }
                }}
                onNodeDragStop={(event, node) => {
                  if (!node) {
                    return;
                  }

                  if (node.data?.positionMode === "flow") {
                    handleNodeDragStop(event, node);
                    clearGuides();
                    return;
                  }

                  handleNodeDragStop(event, node);
                  clearGuides();
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
                multiSelectionKeyCode={getMultiSelectKey()}
                defaultEdgeOptions={{
                  style: { stroke: "transparent" },
                  animated: false,
                }}
                fitView
                style={{
                  width: "100%",
                  height: "100%",
                  cursor: placementMode
                    ? "crosshair"
                    : drawingMode
                      ? "crosshair"
                      : "default",
                }}
                onMoveEnd={handleMoveEnd}
              ></ReactFlow>
            </>
          )}
        </div>

        {selectedNodes.length > 0 && (
          <InspectorPanel
            selectedNodes={inspectorSelection.map(
              (sn) => {
                const node = nodes.find((n: any) => n.id === sn.id) || sn;
                if (node.type === "header" || node.type === "footer") {
                  const layout = layoutById.get(node.id);
                  const parentWidth =
                    nodes.find((p: any) => p.id === node.parentNode)?.data
                      ?.pageWidth ??
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
                  return {
                    ...node,
                    position: getFlowRenderPosition(node),
                  };
                }
                return node;
              }
            )}
            allNodes={nodes}
            updateNode={(id: string, updates: any) => {
              const shouldRefreshSize =
                updates?.width !== undefined || updates?.height !== undefined;
              setNodesNormalized((nds: any) => {
                const updatedNodes = nds.map((n: any) => {
                  if (n.id === id) {
                    // Clear data.height when updating height to let style.height take precedence
                    const { height, ...otherUpdates } = updates;
                    return {
                      ...n,
                      data: { 
                        ...n.data, 
                        ...otherUpdates,
                        ...(height !== undefined ? { height: undefined } : {})
                      },
                      position:
                        updates.position !== undefined
                          ? updates.position
                          : n.position,
                      style: {
                        ...n.style,
                        ...(updates.width !== undefined
                          ? { width: updates.width }
                          : {}),
                        ...(updates.height !== undefined
                          ? { height: updates.height }
                          : {}),
                      },
                    };
                  }
                  return n;
                });

                setSelectedNodes((prev) =>
                  prev.map((sn) => {
                    const updated = updatedNodes.find(
                      (n: any) => n.id === sn.id
                    );
                    return updated || sn;
                  })
                );

                return updatedNodes;
              });

              if (shouldRefreshSize) {
                refreshNodeInternals(id);
              }
            }}
            updateNodes={(ids: string[], updates: any) => {
              setNodesNormalized((nds: any) => {
                const { __addNode, ...restUpdates } = updates || {};
                if (__addNode) {
                  return [...nds, __addNode];
                }

                // Clear data.height when updating height to let style.height take precedence
                const { height, ...otherUpdates } = restUpdates;

                const updatedNodes = nds.map((n: any) => {
                  if (ids.includes(n.id)) {
                    return {
                      ...n,
                      data: { 
                        ...n.data, 
                        ...otherUpdates,
                        ...(height !== undefined ? { height: undefined } : {})
                      },
                      position:
                        restUpdates.position !== undefined
                          ? restUpdates.position
                          : n.position,
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
                    const updated = updatedNodes.find(
                      (n: any) => n.id === sn.id
                    );
                    return updated || sn;
                  })
                );

                if (
                  restUpdates?.width !== undefined ||
                  restUpdates?.height !== undefined
                ) {
                  refreshNodeInternals(ids);
                }

                return updatedNodes;
              });
            }}
            deleteNode={(id: string) => {
              setNodesNormalized((nds: any) =>
                nds.filter((n: any) => n.id !== id)
              );
              setSelectedNodes([]);
              setSelectedNode(null);
            }}
            deleteNodes={(ids: string[]) => {
              setNodesNormalized((nds: any) =>
                nds.filter((n: any) => !ids.includes(n.id))
              );
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
