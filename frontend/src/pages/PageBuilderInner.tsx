/**
 * PageBuilderInner (Main Canvas Shell)
 *
 * Responsibility:
 * - Compose the visual builder experience by wiring state hooks, rule resolvers, and ReactFlow.
 * - Adapt persisted node/page state into render-ready node props.
 * - Coordinate user actions (selection, placement, drag/resize, export) via dedicated hooks/modules.
 *
 * Architectural Boundary:
 * - This file is an orchestrator, not the source of truth for policy math.
 * - Core rules should remain in `frontendRules/*` and specialized hooks.
 * - Local logic here should focus on wiring, delegation, and UI-state synchronization.
 *
 * Ownership Map:
 * - layout sizing/position policy -> `frontendRules/layout/*`
 * - flow/column ownership math -> `frontendRules/flow/*` + `useColumnDropZones`
 * - drag/smart guide policy -> `frontendRules/interaction/*` + `useSmartGuides`
 * - resize policy -> `frontendRules/resize/*`
 * - selection bundling/policy -> `frontendRules/selection/*`
 * - render projection adapters -> `useTransformedCanvasNodes`
 * - placement + frame-hit selection adapters -> `usePageBuilderCanvasState`
 * - menu/layer/canvas/inspector UI wiring -> `usePageBuilderInnerHandlers`
 * - export orchestration -> `usePageBuilderExport`
 * - z-index/layer ordering -> `frontendRules/layering/*`
 * - export preflight/safety -> `frontendRules/export/*` + `exportNextJsZip`
 *
 * Data Flow (High Level):
 * 1) `useSiteState` provides active page state (`nodes`, `edges`, page metadata).
 * 2) Resolver/hook outputs are merged into `transformedNodes` for ReactFlow rendering.
 * 3) User interactions trigger action handlers that update page state through normalized setters.
 * 4) Export path snapshots current page nodes, validates with policy, then delegates ZIP generation.
 *
 * Editing Guidance:
 * - Safe edits here: UI wiring, callback composition, panel visibility rules, handler delegation.
 * - Higher-risk edits: `transformedNodes` mapping, flow/absolute transition sync, export snapshot path.
 * - Before changing behavior, prefer updating the owning resolver/hook and consuming it here.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
import { usePageBuilderInnerHandlers } from "./canvas/usePageBuilderInnerHandlers";
import { useTransformedCanvasNodes } from "./canvas/useTransformedCanvasNodes";
import { usePageBuilderCanvasState } from "./canvas/usePageBuilderCanvasState";
import { usePageBuilderExport } from "./canvas/usePageBuilderExport";

import { useSiteState } from "../components/builder/hooks/useSiteState";
import { useNodeOperations } from "../components/builder/hooks/useNodeOperations";
import { useColumnDropZones } from "../components/builder/hooks/useColumnDropZones";
import { useWorkflowOperations } from "../components/builder/hooks/useWorkflowOperations";
import { generateColumnNodes, removeExcessColumns } from "../utils/columnNodes";
import { normalizeZIndex } from "../frontendRules/layering/layeringResolvers";
import {
  getMultiSelectKey,
} from "../frontendRules/interaction/interactionResolvers";

// ===== APPLICATION MODE =====
// "workflow" enables AI execution; "builder" is page design only
const MODE: "workflow" | "builder" = "builder";

// ===== NODE TYPE REGISTRY =====
// Defined outside the component to preserve referential equality across renders.
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

const NOOP = () => {};
const DEFAULT_EDGE_OPTIONS = {
  style: { stroke: "transparent" },
  animated: false,
} as const;
const EMPTY_EDGES: any[] = [];

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
  const nodeTypesMemo = useMemo(() => nodeTypes, []);
  const [searchParams] = useSearchParams();
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

  // Node placement mode (toolbar button and click canvas to place)
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
  // Contract: route node mutations through this wrapper unless bypass is intentional.
  const setNodesNormalized = useCallback(
    (updater: any) => {
      setNodes((nds: any) => {
        const next = typeof updater === "function" ? updater(nds) : updater;
        return Array.isArray(next) ? normalizeZIndex(next) : next;
      });
    },
    [setNodes]
  );

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

  // Export workflow (snapshot + gate checks + async status) lives in its own hook.
  const { isExporting, handleExportNextJSZip } = usePageBuilderExport({
    site,
    nodes,
  });

  // Smart guides for alignment
  const reactFlowInstance = useReactFlow();
  // Use useViewport hook to get reactive viewport that updates on pan/zoom
  const viewport = useViewport();
  const {
    activeGuides,
    handleDrag: handleGuideDrag,
    clearGuides,
    setOverrideKey,
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

  // History (undo/redo) - keyboard shortcuts handled in useHistory hook.
  // Scope snapshots to the active page so undo cannot restore another page's nodes.
  const { undo, redo, canUndo, canRedo } = useHistory(
    nodes,
    setNodesNormalized,
    activePage.id
  );

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

  // Column-specific alignment: map toolbar align actions to flex alignment properties.
  // Updates selected column alignment and mirrors state into selected node snapshot.
  const handleColumnAlign = useCallback(
    (type: string) => {
      const column = selectedNodes.find((n: any) => n.type === "column");
      if (!column) return;

      // Align only the selected column by mapping toolbar intents to flex props.
      const applyAlign = (updates: any) => {
        setNodesNormalized((nds: any[]) =>
          nds.map((n: any) => {
            if (n.id !== column.id) return n;
            const next = {
              ...n,
              data: {
                ...n.data,
                ...updates,
              },
            };
            return next;
          })
        );

        // Keep selectedNodes snapshot in sync for inspector UI.
        setSelectedNodes((prev) =>
          prev.map((sn) =>
            sn.id === column.id
              ? {
                  ...sn,
                  data: {
                    ...sn.data,
                    ...updates,
                  },
                }
              : sn
          )
        );
      };

      switch (type) {
        case "left":
          applyAlign({ alignItems: "flex-start" });
          break;
        case "center-h":
          applyAlign({ alignItems: "center" });
          break;
        case "right":
          applyAlign({ alignItems: "flex-end" });
          break;
        case "stretch":
          applyAlign({ alignItems: "stretch" });
          break;
        case "top":
          applyAlign({ justifyContent: "flex-start" });
          break;
        case "center-v":
          applyAlign({ justifyContent: "center" });
          break;
        case "bottom":
          applyAlign({ justifyContent: "flex-end" });
          break;
        case "space-between":
          applyAlign({ justifyContent: "space-between" });
          break;
        default:
          break;
      }
    },
    [selectedNodes, setNodesNormalized]
  );

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

  // Ensure column metadata nodes exist for every column owner and stay in sync with column counts.
  useEffect(() => {
    const sectionHasRows = (sectionId: string) =>
      nodes.some((n) => n.type === "row" && n.parentNode === sectionId);

    // Migrate any section-owned column content into the first row when rows exist.
    const sectionsWithRows = nodes.filter(
      (n: any) => n.type === "section" && sectionHasRows(n.id)
    );

    const needsMigration = sectionsWithRows.some((section: any) => {
      const hasSectionColumns =
        typeof section.data?.columns?.count === "number" ||
        typeof section.data?.columns === "number";
      const hasSectionColumnNodes = nodes.some(
        (n: any) => n.type === "column" && n.data?._ownedByColumn === section.id
      );
      const hasSectionOwnedChildren = nodes.some(
        (n: any) =>
          n.type !== "column" &&
          n.data?._ownedByColumn === section.id &&
          n.data?.positionMode === "flow"
      );
      return hasSectionColumns || hasSectionColumnNodes || hasSectionOwnedChildren;
    });

    if (needsMigration) {
      setNodesNormalized((nds: any[]) => {
        let next = [...nds];

        sectionsWithRows.forEach((section: any) => {
          const rows = next.filter(
            (n: any) => n.type === "row" && n.parentNode === section.id
          );
          if (rows.length === 0) return;

          const targetRow = rows[0];
          const rowColCount =
            typeof targetRow.data?.columns?.count === "number"
              ? targetRow.data.columns.count
              : typeof targetRow.data?.columns === "number"
                ? targetRow.data.columns
                : 1;

          // Remove section-owned column metadata nodes.
          next = next.filter(
            (n: any) =>
              !(
                n.type === "column" && n.data?._ownedByColumn === section.id
              )
          );

          // Re-home flow nodes owned by the section into the target row.
          next = next.map((n: any) => {
            if (
              n.type === "column" ||
              n.data?._ownedByColumn !== section.id ||
              n.data?.positionMode !== "flow"
            ) {
              return n;
            }

            const newIndex = Math.min(
              Math.max(n.data?._columnIndex ?? n.data?.columnIndex ?? 0, 0),
              Math.max(0, rowColCount - 1)
            );

            return {
              ...n,
              parentNode: targetRow.id,
              data: {
                ...n.data,
                _ownedByColumn: targetRow.id,
                _rowId: targetRow.id,
                _columnIndex: newIndex,
                columnIndex: newIndex,
              },
              position: { x: 0, y: 0 },
            };
          });

          // Reorder flow nodes within each column after migration.
          const flowSiblings = next
            .filter(
              (n: any) =>
                n.data?._ownedByColumn === targetRow.id &&
                n.data?.positionMode === "flow" &&
                typeof n.data?._columnIndex === "number"
            )
            .sort(
              (a: any, b: any) =>
                (a.data?.order ?? 0) - (b.data?.order ?? 0)
            );

          const orderCursor = new Map<string, number>();
          flowSiblings.forEach((n: any) => {
            const idx = n.data?._columnIndex ?? 0;
            const key = `${targetRow.id}:${idx}`;
            const current = orderCursor.get(key) ?? 0;
            orderCursor.set(key, current + 1);
            n.data.order = current;
          });

          // Clear section-level columns so future sync doesn't recreate them.
          next = next.map((n: any) =>
            n.id === section.id
              ? { ...n, data: { ...n.data, columns: undefined } }
              : n
          );
        });

        return next;
      });
    }

    // Identify owners that actively expose columns
    const owners = nodes.filter((n: any) => {
      const count =
        typeof n.data?.columns?.count === "number"
          ? n.data.columns.count
          : typeof n.data?.columns === "number"
            ? n.data.columns
            : 0;
      if (!count || count < 1) return false;

      if (n.type === "section") {
        // Sections with rows delegate columns to the rows; do not create section-level column nodes.
        if (sectionHasRows(n.id)) return false;
        return true;
      }

      return n.type === "row" || n.type === "header" || n.type === "footer";
    });

    let needsSync = false;

    // Detect orphan or out-of-range column nodes
    nodes.forEach((n: any) => {
      if (n.type !== "column") return;
      const owner = owners.find((o: any) => o.id === n.data?._ownedByColumn);
      if (!owner) {
        needsSync = true;
        return;
      }
      const count =
        typeof owner.data?.columns?.count === "number"
          ? owner.data.columns.count
          : typeof owner.data?.columns === "number"
            ? owner.data.columns
            : 0;
      if (
        typeof n.data?._columnIndex !== "number" ||
        n.data._columnIndex < 0 ||
        n.data._columnIndex >= count
      ) {
        needsSync = true;
      }
    });

    // Detect missing column nodes per owner/index
    owners.forEach((owner: any) => {
      const count =
        typeof owner.data?.columns?.count === "number"
          ? owner.data.columns.count
          : typeof owner.data?.columns === "number"
            ? owner.data.columns
            : 0;
      for (let idx = 0; idx < count; idx++) {
        const exists = nodes.some(
          (n: any) =>
            n.type === "column" &&
            n.data?._ownedByColumn === owner.id &&
            n.data?._columnIndex === idx
        );
        if (!exists) {
          needsSync = true;
        }
      }
    });

    if (!needsSync) return;

    const ownerIds = new Set(owners.map((o: any) => o.id));

    setNodesNormalized((nds: any[]) => {
      let next = [...nds];

      // Drop column nodes whose owners are no longer valid (including sections with rows).
      next = next.filter(
        (n: any) =>
          !(n.type === "column" && !ownerIds.has(n.data?._ownedByColumn))
      );

      owners.forEach((owner: any) => {
        const count =
          typeof owner.data?.columns?.count === "number"
            ? owner.data.columns.count
            : typeof owner.data?.columns === "number"
              ? owner.data.columns
              : 0;

        // Trim any excess columns for this owner.
        next = removeExcessColumns(next, owner.id, count);

        const existing = next.filter(
          (n: any) => n.type === "column" && n.data?._ownedByColumn === owner.id
        );
        const regenerated = generateColumnNodes(owner.id, count, existing);

        // Replace owner's column set with regenerated list to ensure coverage.
        next = next.filter(
          (n: any) =>
            !(n.type === "column" && n.data?._ownedByColumn === owner.id)
        );
        next = [...next, ...regenerated];
      });

      return next;
    });
  }, [nodes, setNodesNormalized]);

  const selectedNodesForShortcuts = useMemo(
    () =>
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNode
          ? [selectedNode]
          : [],
    [selectedNodes, selectedNode]
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedNodes: selectedNodesForShortcuts,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onSelectAll: handleSelectAll,
    onDeselect: handleDeselect,
  });

  const hasSelection = selectedNodes.length > 0 || selectedNode !== null;


  // Force ReactFlow to recalc node dimensions when we update size programmatically
  // Use after programmatic size updates so handles/bounds stay accurate.
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

  // Canvas-state adapter centralizes frame-bundle selection, layout maps, and placement math.
  const {
    selectSectionWithBars,
    inspectorSelection,
    flowStackOffsets,
    layoutById,
    sectionHeightById,
    placeNodeAtEvent,
    selectFrameAtPoint,
    getFlowRenderPosition,
  } = usePageBuilderCanvasState({
    nodes,
    selectedNodes,
    setSelectedNode,
    setSelectedNodes,
    placementMode,
    setPlacementMode,
    reactFlowInstance,
    findDropTarget,
    setNodesNormalized,
    getDefaultNodeData,
  });

  // Extracted render-node projection to keep this component focused on orchestration.
  const { transformedNodes } = useTransformedCanvasNodes({
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
    getFlowRenderPosition,
    setSelectedNode,
    setSelectedNodes,
    setIsResizing,
    setIsEditingRadius,
    reactFlowInstance,
  });

  // Extracted UI wiring (menu/layer/canvas/inspector callbacks + derived view props)
  // to keep this file focused on orchestration and data flow.
  const {
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
  } = usePageBuilderInnerHandlers({
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
  });

  const isWorkflowMode = MODE === "workflow";
  const connectionValidator = useCallback(() => isWorkflowMode, [isWorkflowMode]);

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
        exporting={isExporting}
        onNavigateHome={onNavigateHome}
        onNavigateDashboard={onNavigateDashboard}
        pages={site.pages}
        activePageId={site.activePageId}
        onPageSelect={handlePageSelect}
        onPageAdd={handlePageAdd}
        onPageRename={handlePageRename}
        onPageDelete={handlePageDelete}
        onUndo={undo}
        onRedo={redo}
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
        onToggleGrid={onToggleGrid}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomToFit={onZoomToFit}
        onZoomTo100={handleZoomTo100}
        onViewportChange={setPreviewMode}
        currentViewport={previewMode}
        showGrid={showGrid}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={hasSelection}
      />

      <div className={`visualbuilder-root ${selectedNode ? "panel-open" : ""}`}>
        {hasFrame && selectedNodes.length > 0 && !isSectionBundle && (
          <AlignmentToolbar
            selectedNodes={selectedNodes}
            onAlign={handleAlign}
            onDistribute={handleDistribute}
            onDuplicate={handleDuplicate}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onSetColumns={handleSetColumns}
            onColumnAlign={handleColumnAlign}
            visible={true}
          />
        )}
        {hasFrame && (
          <LayerPanel
            nodes={normalizedLayerNodes}
            selectedNode={selectedNode}
            onNodeSelect={handleLayerNodeSelect}
            onNodeDelete={handleLayerNodeDelete}
            onNodeVisibilityToggle={NOOP}
            onNodeLock={NOOP}
            onUpdateNode={handleLayerUpdateNode}
            onReorderNodes={handleLayerReorderNodes}
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
            addNode={handleAddToolbarNode}
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
                onClick={handleAddFrame}
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
                onToggleGrid={onToggleGrid}
              />
              <ReactFlow
                nodes={transformedNodes}
                edges={isWorkflowMode ? edges : EMPTY_EDGES}
                nodeTypes={nodeTypesMemo}
                onNodesChange={onNodesChange}
                onNodeClick={handleCanvasNodeClick}
                onEdgesChange={isWorkflowMode ? onEdgesChange : NOOP}
                onConnect={isWorkflowMode ? onConnect : NOOP}
                isValidConnection={connectionValidator}
                nodesConnectable={isWorkflowMode}
                nodesDraggable={canDragCanvas}
                elementsSelectable={!drawingMode}
                selectNodesOnDrag={true}
                elevateNodesOnSelect={false}
                panOnDrag={!drawingMode}
                zoomOnScroll={!drawingMode}
                onNodeDragStart={handleCanvasNodeDragStart}
                onNodeDrag={handleCanvasNodeDrag}
                onNodeDragStop={handleCanvasNodeDragStop}
                onPaneClick={handleCanvasPaneClick}
                multiSelectionKeyCode={getMultiSelectKey()}
                defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
                fitView
                style={reactFlowStyle}
                onMoveEnd={handleMoveEnd}
              ></ReactFlow>
            </>
          )}
        </div>

        {selectedNodes.length > 0 && (
          <InspectorPanel
            selectedNodes={inspectorPanelSelectedNodes}
            allNodes={nodes}
            updateNode={updateInspectorNode}
            updateNodes={updateInspectorNodes}
            deleteNode={deleteInspectorNode}
            deleteNodes={deleteInspectorNodes}
            onClose={closeInspector}
          />
        )}
      </div>
    </>
  );
}
