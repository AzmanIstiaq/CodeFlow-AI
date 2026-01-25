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
 * Enforce consistent z-index layering across all nodes
 * Sections stay behind (0), rows middle (1), content on top (10)
 * Prevents visual hierarchy issues after node operations
 */
const normalizeZIndex = (nodeList: any[]) =>
  nodeList.map((node: any) => {
    const zIndex = node.type === "section" ? 0 : node.type === "row" ? 1 : 10;
    return node.zIndex === zIndex ? node : { ...node, zIndex };
  });

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
    exportNextJSZip(site as any);
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

  // Walk parent chains to convert nested positions into canvas space for drop/extent math.
  // ReactFlow stores positions relative to parents, so this keeps absolute layout deterministic.
  // Must stay read-only to avoid mutating node graphs during drag/drop inspection.
  const getAbsolutePosition = useCallback(
    (nodeId: string | undefined | null) => {
      if (!nodeId) return { x: 0, y: 0 };
      let accX = 0;
      let accY = 0;
      let current = nodes.find((n: any) => n.id === nodeId);
      const visited = new Set<string>();
      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        accX += current.position?.x ?? 0;
        accY += current.position?.y ?? 0;
        if (!current.parentNode) break;
        current = nodes.find((n: any) => n.id === current!.parentNode);
      }
      return { x: accX, y: accY };
    },
    [nodes]
  );

  // Anchor each row to a deterministic origin inside its owning section for flow rendering.
  // Flow stacks depend on these offsets remaining stable so column math doesn't reorder nodes.
  // Section width is captured here to avoid recalculating it per child transform.
  const rowLayoutById = useMemo(() => {
    const layout = new Map<string, { x: number; y: number; width: number }>();
    const sections = nodes.filter((n: any) => n.type === "section");

    sections.forEach((section: any) => {
      const sectionPadding = 0;
      const sectionGap = 0;
      const sectionWidth =
        section.width ?? section.data?.pageWidth ?? section.data?.maxWidth ?? 0;

      const rows = nodes
        .filter((n: any) => n.type === "row" && n.parentNode === section.id)
        .sort((a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0));

      let currentY = sectionPadding;
      rows.forEach((row: any) => {
        const isOnlyRow = rows.length === 1;
        layout.set(row.id, { x: 0, y: currentY, width: sectionWidth });
        const rowHeight = isOnlyRow
          ? (section.data?.pageHeight ?? row.data?.rowHeight ?? row.height ?? 0)
          : (row.data?.rowHeight ?? row.height ?? 0);
        currentY += rowHeight + sectionGap;
      });
    });

    return layout;
  }, [nodes]);

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

      if (!target) {
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
        draggable: defaultData.positionMode === "absolute",
        style: defaultData.width
          ? {
              width: defaultData.width,
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
    },
    [nodes, reactFlowInstance]
  );

  // Precompute vertical offsets for flow nodes within each column so rendering avoids rescanning siblings.
  // Offsets rely only on saved order metadata, keeping absolute and flow coordinate systems decoupled.
  // This keeps ReactFlow painting deterministic even while drag/drop mutates selection state.
  const flowStackOffsets = useMemo(() => {
    const offsets = new Map<string, number>();
    const groups = new Map<string, any[]>();

    const getNodeHeight = (node: any) => {
      const h =
        (node.style?.height as number | undefined) ??
        (node.height as number | undefined) ??
        (node.data?.height as number | undefined);
      return typeof h === "number" ? Math.max(h, 16) : 48;
    };

    nodes.forEach((n: any) => {
      if (n.data?.positionMode !== "flow") return;
      if (n.data?._ownedByColumn === undefined || n.data?._columnIndex === undefined)
        return;
      const key = `${n.data._ownedByColumn}:${n.data._columnIndex}`;
      const list = groups.get(key) ?? [];
      list.push(n);
      groups.set(key, list);
    });

    groups.forEach((list, key) => {
      const [ownerId, colIndex] = key.split(":");
      const owner = nodes.find((n: any) => n.id === ownerId);
      const columnGap =
        (owner?.data?.columns?.gap as number | undefined) !== undefined
          ? owner?.data?.columns?.gap
          : 16;
      const columnPaddingY = owner?.type === "section" ? 40 : 0;

      list
        .sort((a: any, b: any) => (a.data?.order ?? 0) - (b.data?.order ?? 0))
        .forEach((n: any, idx: number) => {
          const prevHeight = idx === 0 ? 0 : getNodeHeight(list[idx - 1]);
          const prevOffset = idx === 0 ? columnPaddingY : offsets.get(list[idx - 1].id) ?? columnPaddingY;
          const nextOffset =
            idx === 0 ? columnPaddingY : prevOffset + prevHeight + (columnGap ?? 0);
          offsets.set(n.id, nextOffset);
        });
    });

    return offsets;
  }, [nodes]);

  const getFlowRenderPosition = useCallback(
    (node: any) => {
      if (node?.data?.positionMode !== "flow") return node?.position;
      const flowY = flowStackOffsets.get(node.id) ?? 0;
      let flowX = 0;
      if (
        node.data?._columnIndex !== undefined &&
        node.data?._ownedByColumn
      ) {
        const owner = nodes.find(
          (n: any) => n.id === node.data?._ownedByColumn
        );
        const ownerLayout = rowLayoutById.get(node.data?._ownedByColumn);
        const ownerWidth =
          ownerLayout?.width ??
          owner?.style?.width ??
          owner?.width ??
          owner?.data?.width ??
          0;
        const columnCount =
          owner?.data?.columns?.count ?? owner?.data?.columns ?? 1;
        if (ownerWidth && columnCount > 0) {
          flowX = (ownerWidth / columnCount) * node.data._columnIndex;
        }
      }
      return { x: flowX, y: flowY };
    },
    [flowStackOffsets, nodes, rowLayoutById]
  );

  // Project builder nodes into ReactFlow props while preserving flow/absolute intent and layering.
  // Ordering and z-index normalization here must stay stable or selection/extent math drifts.
  // Keep this pure so downstream hooks can trust node data remains untouched during render.
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
            const ownerLayout = rowLayoutById.get(n.data?._ownedByColumn);
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
            draggable: !n.data?.locked && (isFlow ? true : baseDraggable),
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
                setNodesNormalized((nds: any) =>
                  nds.map((node: any) =>
                    node.id === n.id
                      ? {
                          ...node,
                          ...(node.data?.positionMode === "absolute"
                            ? { position: { x: params.x, y: params.y } }
                            : {}),
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
    rowLayoutById,
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
                  if (node.type === "row") {
                    const parentSection = nodes.find(
                      (n: any) =>
                        n.type === "section" && n.id === node.parentNode
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
                }}
                onNodeDrag={(event, node) => {
                  if (!node) return;

                  handleNodeDrag(event, node);
                  if (node.data?.positionMode !== "flow") {
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
                multiSelectionKeyCode="Shift"
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
            selectedNodes={selectedNodes.map(
              (sn) => {
                const node = nodes.find((n: any) => n.id === sn.id) || sn;
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
              setNodesNormalized((nds: any) => {
                const updatedNodes = nds.map((n: any) => {
                  if (n.id === id) {
                    return {
                      ...n,
                      data: { ...n.data, ...updates },
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

                // Update selectedNodes with fresh data from the new nodes array
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

                // Update selectedNodes with fresh data from the new nodes array
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
