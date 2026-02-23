import { useCallback, useMemo } from "react";
import {
  computeAbsolutePosition,
  computeFlowStackOffsets,
  computeLayoutMaps,
  getFlowRenderPosition as resolveFlowRenderPosition,
} from "../../frontendRules/layout/layoutResolvers";
import { isBarNode } from "../../frontendRules/layout/layoutPolicy";
import {
  bundleSectionSelection,
  deriveInspectorSelection,
  isPointInsideFrame,
} from "../../frontendRules/selection/selectionResolvers";

interface UsePageBuilderCanvasStateProps {
  nodes: any[];
  selectedNodes: any[];
  setSelectedNode: (node: any) => void;
  setSelectedNodes: (nodes: any[]) => void;
  placementMode: { type: string; label: string } | null;
  setPlacementMode: (value: any) => void;
  reactFlowInstance: any;
  findDropTarget: (point: { x: number; y: number }) => any;
  setNodesNormalized: (updater: any) => void;
  getDefaultNodeData: (type: string, label: string) => any;
}

/**
 * Canvas-state orchestrator for PageBuilderInner.
 *
 * Owns:
 * - Frame-bundled selection behavior
 * - Layout-derived maps used by render/interaction adapters
 * - Node placement math (toolbar click-to-place)
 * - Frame hit-testing used by pane click selection
 */
export function usePageBuilderCanvasState({
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
}: UsePageBuilderCanvasStateProps) {
  const selectSectionWithBars = useCallback(
    (sectionNode: any) => {
      const bundled = bundleSectionSelection(nodes, sectionNode);
      setSelectedNode(sectionNode);
      setSelectedNodes(bundled);
    },
    [nodes, setSelectedNode, setSelectedNodes]
  );

  const inspectorSelection = useMemo(
    () => deriveInspectorSelection(selectedNodes),
    [selectedNodes]
  );

  const getAbsolutePosition = useCallback(
    (nodeId: string | undefined | null) => computeAbsolutePosition(nodeId, nodes),
    [nodes]
  );

  const flowStackOffsets = useMemo(() => computeFlowStackOffsets(nodes), [nodes]);
  const { layoutById, sectionHeightById } = useMemo(
    () => computeLayoutMaps(nodes),
    [nodes]
  );

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
          const colRect = (target as any)?.rect ?? null;
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
        parentNode,
        position,
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
    [
      placementMode,
      getDefaultNodeData,
      reactFlowInstance,
      findDropTarget,
      nodes,
      getAbsolutePosition,
      setNodesNormalized,
      setPlacementMode,
      setSelectedNode,
      setSelectedNodes,
    ]
  );

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

  const getFlowRenderPosition = useCallback(
    (node: any) =>
      resolveFlowRenderPosition(node, flowStackOffsets, nodes, layoutById),
    [flowStackOffsets, nodes, layoutById]
  );

  return {
    selectSectionWithBars,
    inspectorSelection,
    flowStackOffsets,
    layoutById,
    sectionHeightById,
    placeNodeAtEvent,
    selectFrameAtPoint,
    getFlowRenderPosition,
  };
}
