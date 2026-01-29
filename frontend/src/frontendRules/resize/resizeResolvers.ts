/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how header/footer resize updates persist.
 * If bar resize math changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function resolveBarResizeState(
  node: any,
  params: any,
  layoutWidth?: number,
  layoutY?: number
) {
  const nextHeight = Math.round(params.height);
  const fallbackWidth =
    (node.style?.width as number | undefined) ??
    (node.data?.width as number | undefined) ??
    0;
  const nextWidth = Math.round(
    (params.width as number | undefined) ?? layoutWidth ?? fallbackWidth
  );
  const nextPosition = { x: 0, y: layoutY ?? 0 };

  return { nextWidth, nextHeight, nextPosition };
}

/**
 * SINGLE SOURCE OF TRUTH
 *
 * This function defines how general node resize updates persist.
 * If resize → data/style sync changes, fix it HERE.
 *
 * DO NOT reimplement this logic elsewhere.
 * PageBuilderInner must call this function.
 */
export function resolveContentResizeState(node: any, params: any) {
  const nextWidth = params.width;
  const nextHeight = params.height;
  const nextPosition =
    node.data?.positionMode === "absolute"
      ? { x: params.x, y: params.y }
      : undefined;

  return { nextWidth, nextHeight, nextPosition };
}
