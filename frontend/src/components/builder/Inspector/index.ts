/**
 * File: Inspector/index.ts
 *
 * Purpose:
 * - Re-export Inspector panel entry points.
 *
 * Controls:
 * - Public import surface for inspector component and its prop types.
 *
 * Directly related files:
 * - frontend/src/components/builder/Inspector/InspectorPanel.tsx
 * - frontend/src/components/builder/Inspector/types.ts
 */

export { default as InspectorPanel } from "./InspectorPanel";
export type { InspectorProps, SectionProps } from "./types";
