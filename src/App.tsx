import ConnectionDetails from './components/ConnectionDetails';
import NodeDetails from './components/NodeDetails';
import WorkflowCanvas from './components/WorkflowCanvas';
import WorkflowToolbar from './components/WorkflowToolbar';
import { useWorkflowEditor } from './hooks/useWorkflowEditor';

export default function App() {
    const editor = useWorkflowEditor();

    return (
        <main>
            <header className="app-header">
                <div>
                    <p className="app-eyebrow">Workflow builder</p>
                    <h1>Dashboard</h1>
                </div>
                <p className="app-count">
                    {editor.workflowItems.length} {editor.workflowItems.length === 1 ? 'task' : 'tasks'}
                </p>
            </header>

            <WorkflowToolbar
                isRunning={editor.isRunning}
                canRun={editor.startWorkflowId !== null}
                onRun={() => editor.runWorkflow(editor.startWorkflowId)}
                onCreate={editor.handleCreateWorkflow}
            />

            {editor.connectionError && (
                <div key={editor.connectionError.id} className="workflow-toast" role="alert">
                    {editor.connectionError.message}
                </div>
            )}

            <div className="dashboard">
                <WorkflowCanvas
                    workflows={editor.workflowItems}
                    connections={editor.connections}
                    selectedWorkflowId={editor.selectedWorkflowId}
                    startWorkflowId={editor.startWorkflowId}
                    onSelectWorkflow={editor.selectWorkflow}
                    onMoveWorkflow={editor.handleMoveWorkflow}
                    onUpdateWorkflow={editor.handleUpdateWorkflow}
                    onConnectWorkflows={editor.handleConnectWorkflows}
                    onDeleteConnections={editor.handleDeleteConnections}
                    onDeleteWorkflows={editor.handleDeleteWorkflows}
                    selectedConnectionId={editor.selectedConnectionId}
                    onSelectConnection={editor.selectConnection}
                />

                {editor.selectedConnection && editor.selectedConnectionSource && editor.selectedConnectionTarget ? (
                    <ConnectionDetails
                        source={editor.selectedConnectionSource}
                        target={editor.selectedConnectionTarget}
                        onDeleteConnection={() => editor.handleDeleteConnections([editor.selectedConnection!.id])}
                    />
                ) : editor.selectedWorkflow ? (
                    <NodeDetails
                        workflow={editor.selectedWorkflow}
                        onRetryWorkflow={editor.runWorkflow}
                        isStartNode={editor.selectedWorkflow.id === editor.startWorkflowId}
                        isRunning={editor.isRunning}
                        onSetStartNode={editor.setStartWorkflowId}
                        onDeleteWorkflow={editor.handleDeleteWorkflow}
                    />
                ) : (
                    <p>Select a workflow to view its details.</p>
                )}
            </div>
        </main>
    );
}
