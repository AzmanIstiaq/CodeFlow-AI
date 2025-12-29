export const INVALID_COLUMN_CHILD_TYPES = new Set<string>([
  "section",
  "columnsSection",
  "start",
  "ai",
  "output",
]);

export const generateId = (prefix: string): string => {
  return prefix + "_" + Math.random().toString(36).substring(2, 9);
};

export const normalizeOrder = (
  nodeList: any[],
  edgeList: any[],
  parentId?: string
) => {
  const scoped = parentId
    ? nodeList.filter((n) =>
        edgeList.some((e) => e.source === parentId && e.target === n.id)
      )
    : nodeList.filter((n) => n.type === "section");

  scoped
    .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
    .forEach((n, index) => {
      n.data.order = index;
    });

  return nodeList;
};
