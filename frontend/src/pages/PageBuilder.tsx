import { ReactFlowProvider } from "reactflow";
import PageBuilderInner from "./PageBuilderInner";

export default function PageBuilder() {
  return (
    <ReactFlowProvider>
      <PageBuilderInner />
    </ReactFlowProvider>
  );
}
