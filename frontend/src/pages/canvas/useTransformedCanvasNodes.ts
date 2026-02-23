import { useMemo } from "react";
import {
  isNodeDraggable,
} from "../../frontendRules/interaction/interactionPolicy";
import {
  resolveBarResizeState,
  resolveContentResizeState,
} from "../../frontendRules/resize/resizeResolvers";

interface UseTransformedCanvasNodesProps {
  nodes: any[];
  selectedNode: any;
  selectedNodes: any[];
  sectionHeightById: Map<string, number>;
  layoutById: Map<string, any>;
  registerColumnRect: (...args: any[]) => void;
  viewportVersion: number;
  hoverState: any;
  placementMode: any;
  setNodesNormalized: (updater: any) => void;
  setNodes: (updater: any) => void;
  placeNodeAtEvent: (event: any) => boolean;
  flowStackOffsets: Map<string, number>;
  getFlowRenderPosition: (node: any) => any;
  setSelectedNode: (node: any) => void;
  setSelectedNodes: (nodes: any[] | ((prev: any[]) => any[])) => void;
  setIsResizing: (value: boolean) => void;
  setIsEditingRadius: (value: boolean) => void;
  reactFlowInstance: any;
}

/**
 * Projects persisted builder nodes into render-ready ReactFlow nodes.
 * Keeps PageBuilderInner focused on orchestration while this hook owns
 * presentation-time projection and per-node interaction adapters.
 */
export function useTransformedCanvasNodes({
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
}: UseTransformedCanvasNodesProps) {
  const transformedNodes = useMemo(() => {
    return (
      nodes
        .filter((n: any) => n.type !== "column" && !n.data?.hidden)
        .sort((a: any, b: any) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((n: any) => {
          const isSelected =
            selectedNode?.id === n.id ||
            selectedNodes.some((sn) => sn.id === n.id);
          if (n.type === "section") {
            const computedHeight = sectionHeightById.get(n.id);
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
                ...(manualHeight
                  ? { height: manualHeight }
                  : computedHeight
                    ? { height: computedHeight }
                    : {}),
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
          const flowPosition = isFlow ? getFlowRenderPosition(n) : null;

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
                  x: (flowPosition as any)?.x ?? n.position.x ?? 0,
                  y:
                    (flowPosition as any)?.y ??
                    flowStackOffsets.get(n.id) ??
                    n.position.y ??
                    0,
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
              ...(isFlow &&
              (flowPosition as any)?._alignItems === "stretch" &&
              (flowPosition as any)?._columnWidth
                ? { width: (flowPosition as any)._columnWidth }
                : {}),
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
    getFlowRenderPosition,
    setSelectedNode,
    setSelectedNodes,
    setIsResizing,
    setIsEditingRadius,
    reactFlowInstance,
  ]);

  return { transformedNodes };
}
