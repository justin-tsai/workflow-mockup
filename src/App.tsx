import ConnectionDetails from "./components/ConnectionDetails";
import NodeDetails from "./components/NodeDetails";
import WorkflowCanvas from "./components/WorkflowCanvas";
import WorkflowToolbar from "./components/WorkflowToolbar";
import { useWorkflowEditor } from "./hooks/useWorkflowEditor";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const editor = useWorkflowEditor();

  return (
    <>
      <main>
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Workflow builder</p>
          <h1>Dashboard</h1>
        </div>
        <p className="app-count">
          {editor.nodes.length} {editor.nodes.length === 1 ? "node" : "nodes"}
        </p>
      </header>

      <WorkflowToolbar
        isRunning={editor.isRunning}
        canRun={editor.startNodeId !== null}
        onRun={() => editor.runWorkflow(editor.startNodeId)}
        onCreate={editor.handleCreateNode}
      />

      {editor.connectionError && (
        <div
          key={editor.connectionError.id}
          className="workflow-toast"
          role="alert"
        >
          {editor.connectionError.message}
        </div>
      )}

      <div className="dashboard">
        <WorkflowCanvas
          nodes={editor.nodes}
          edges={editor.edges}
          selectedNodeId={editor.selectedNodeId}
          startNodeId={editor.startNodeId}
          onSelectNode={editor.selectNode}
          onMoveNode={editor.handleMoveNode}
          onUpdateNode={editor.handleUpdateNode}
          onConnectNodes={editor.handleConnectNodes}
          onDeleteEdges={editor.handleDeleteEdges}
          onDeleteNodes={editor.handleDeleteNodes}
          selectedEdgeId={editor.selectedEdgeId}
          onSelectEdge={editor.selectEdge}
          isRunning={editor.isRunning}
        />

        {editor.selectedEdge &&
        editor.selectedEdgeSource &&
        editor.selectedEdgeTarget ? (
          <ConnectionDetails
            source={editor.selectedEdgeSource}
            target={editor.selectedEdgeTarget}
            onDeleteConnection={() =>
              editor.handleDeleteEdges([editor.selectedEdge!.id])
            }
          />
        ) : editor.selectedNode ? (
          <NodeDetails
            node={editor.selectedNode}
            onRetryWorkflow={editor.runWorkflow}
            isStartNode={editor.selectedNode.id === editor.startNodeId}
            isRunning={editor.isRunning}
            onSetStartNode={editor.setStartNodeId}
            onDeleteWorkflow={(nodeId) => editor.handleDeleteNodes([nodeId])}
          />
        ) : (
          <p>Select a node to view its details.</p>
        )}
      </div>
      </main>
      <Analytics />
    </>
  );
}
