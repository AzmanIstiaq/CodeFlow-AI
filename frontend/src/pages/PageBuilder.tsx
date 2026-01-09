/**
 * Page Builder Provider Wrapper
 *
 * Purpose:
 * - Provide React Flow context to the visual builder page.
 *
 * Role in the system:
 * - Ensures the builder subtree can access React Flow hooks and state.
 *
 * Key responsibilities:
 * - Wrap the inner builder implementation with ReactFlowProvider.
 *
 * Important constraints and assumptions:
 * - ReactFlowProvider must sit above any component using React Flow hooks.
 */

import { ReactFlowProvider } from "reactflow";
import PageBuilderInner from "./PageBuilderInner";

// ================================
// Component
// ================================
/**
 * Wrapper that injects React Flow context for the builder.
 */
export default function PageBuilder() {
  return (
    <ReactFlowProvider>
      <PageBuilderInner />
    </ReactFlowProvider>
  );
}
