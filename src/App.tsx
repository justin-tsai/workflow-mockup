import { useCallback, useEffect, useMemo, useState } from 'react';
import NodeDetails from './components/NodeDetails';
import ConnectionDetails from './components/ConnectionDetails';
import WorkflowCanvas from './components/WorkflowCanvas';
import WorkflowToolbar from './components/WorkflowToolbar';
import { workflows as initialWorkflows } from './data/workflows';
import { useWorkflowExecution } from './hooks/useWorkflowExecution';
import type { Workflow, WorkflowConnection } from './types/workflow';
import { getNextWorkflowId, wouldCreateCycle } from './utils/workflowGraph';

type ConnectionError = {
    id: number;
    message: string;
};

export default function App() {
    const [workflowItems, setWorkflowItems] = useState<Workflow[]>(initialWorkflows);
    const [connections, setConnections] = useState<WorkflowConnection[]>(() =>
        initialWorkflows.slice(0, -1).map((workflow, index) => ({
            id: `${workflow.id}-${initialWorkflows[index + 1].id}`,
            source: workflow.id,
            target: initialWorkflows[index + 1].id,
        })),
    );
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [startWorkflowId, setStartWorkflowId] = useState<number | null>(initialWorkflows[0]?.id ?? null);
    const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);

    useEffect(() => {
        if (!connectionError) return;

        const timeout = window.setTimeout(() => setConnectionError(null), 3500);
        return () => window.clearTimeout(timeout);
    }, [connectionError]);
    const selectedWorkflow = useMemo(
        () => workflowItems.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
        [selectedWorkflowId, workflowItems],
    );
    const selectedConnection = useMemo(
        () => connections.find((connection) => connection.id === selectedConnectionId) ?? null,
        [connections, selectedConnectionId],
    );
    const selectedConnectionSource = useMemo(
        () => workflowItems.find((workflow) => workflow.id === selectedConnection?.source) ?? null,
        [selectedConnection, workflowItems],
    );
    const selectedConnectionTarget = useMemo(
        () => workflowItems.find((workflow) => workflow.id === selectedConnection?.target) ?? null,
        [selectedConnection, workflowItems],
    );

    const { isRunning, runWorkflow } = useWorkflowExecution({
        workflows: workflowItems,
        connections,
        updateWorkflows: setWorkflowItems,
    });

    const handleCreateWorkflow = useCallback(() => {
        setWorkflowItems((currentWorkflows) => {
            const nextId = getNextWorkflowId(currentWorkflows);
            return [...currentWorkflows, {
                id: nextId,
                name: `New workflow ${nextId}`,
                status: null,
                description: 'A new workflow.',
                x: 100 + currentWorkflows.length * 30,
                y: 100 + currentWorkflows.length * 30,
            }];
        });
    }, []);

    const handleMoveWorkflow = useCallback((workflowId: number, x: number, y: number) => {
        setWorkflowItems((currentWorkflows) => currentWorkflows.map((workflow) =>
            workflow.id === workflowId ? { ...workflow, x, y } : workflow,
        ));
    }, []);

    const handleUpdateWorkflow = useCallback(
        (workflowId: number, updates: Partial<Pick<Workflow, 'name' | 'description'>>) => {
            setWorkflowItems((currentWorkflows) => currentWorkflows.map((workflow) =>
                workflow.id === workflowId ? { ...workflow, ...updates } : workflow,
            ));
        },
        [],
    );

    const handleConnectWorkflows = useCallback((source: number, target: number) => {
        if (wouldCreateCycle(connections, source, target)) {
            setConnectionError({
                id: Date.now(),
                message: 'Cannot connect these tasks because it would create a cycle.',
            });
            return;
        }

        setConnections((currentConnections) =>
            currentConnections.some(
                (connection) => connection.source === source && connection.target === target,
            )
                ? currentConnections
                : [...currentConnections, { id: `${source}-${target}`, source, target }],
        );
    }, [connections]);

    const handleDeleteConnections = useCallback((connectionIds: string[]) => {
        const ids = new Set(connectionIds);
        setConnections((currentConnections) => currentConnections.filter(
            (connection) => !ids.has(connection.id),
        ));
        setSelectedConnectionId((currentId) => currentId !== null && ids.has(currentId) ? null : currentId);
    }, []);

    const handleDeleteWorkflows = useCallback((workflowIds: number[]) => {
        const ids = new Set(workflowIds);

        setWorkflowItems((currentWorkflows) => {
            const remainingWorkflows = currentWorkflows.filter((workflow) => !ids.has(workflow.id));
            setStartWorkflowId((currentStartId) =>
                currentStartId !== null && ids.has(currentStartId)
                    ? remainingWorkflows[0]?.id ?? null
                    : currentStartId,
            );
            return remainingWorkflows;
        });
        setConnections((currentConnections) => currentConnections.filter(
            (connection) => !ids.has(connection.source) && !ids.has(connection.target),
        ));
        setSelectedWorkflowId((currentSelectedId) =>
            currentSelectedId !== null && ids.has(currentSelectedId) ? null : currentSelectedId,
        );
    }, []);

    const handleDeleteWorkflow = useCallback((workflowId: number) => {
        handleDeleteWorkflows([workflowId]);
    }, [handleDeleteWorkflows]);

    const handleDeleteWorkflowNodes = useCallback((workflowIds: number[]) => {
        handleDeleteWorkflows(workflowIds);
    }, [handleDeleteWorkflows]);

    return (
        <main>
            <header className="app-header">
                <div>
                    <p className="app-eyebrow">Workflow builder</p>
                    <h1>Dashboard</h1>
                </div>
                <p className="app-count">
                    {workflowItems.length} {workflowItems.length === 1 ? 'task' : 'tasks'}
                </p>
            </header>
            <WorkflowToolbar
                isRunning={isRunning}
                canRun={startWorkflowId !== null}
                onRun={() => runWorkflow(startWorkflowId)}
                onCreate={handleCreateWorkflow}
            />

            {connectionError && (
                <div key={connectionError.id} className="workflow-toast" role="alert">
                    {connectionError.message}
                </div>
            )}

            <div className="dashboard">
                <WorkflowCanvas
                    workflows={workflowItems}
                    connections={connections}
                    selectedWorkflowId={selectedWorkflowId}
                    startWorkflowId={startWorkflowId}
                    onSelectWorkflow={(workflow) => {
                        setSelectedConnectionId(null);
                        setSelectedWorkflowId(workflow.id);
                    }}
                    onMoveWorkflow={handleMoveWorkflow}
                    onUpdateWorkflow={handleUpdateWorkflow}
                    onConnectWorkflows={handleConnectWorkflows}
                    onDeleteConnections={handleDeleteConnections}
                    onDeleteWorkflows={handleDeleteWorkflowNodes}
                    selectedConnectionId={selectedConnectionId}
                    onSelectConnection={(connectionId) => {
                        setSelectedConnectionId(connectionId);
                        if (connectionId) setSelectedWorkflowId(null);
                    }}
                />

                {selectedConnection && selectedConnectionSource && selectedConnectionTarget ? (
                    <ConnectionDetails
                        source={selectedConnectionSource}
                        target={selectedConnectionTarget}
                        onDeleteConnection={() => handleDeleteConnections([selectedConnection.id])}
                    />
                ) : selectedWorkflow ? (
                    <NodeDetails
                        workflow={selectedWorkflow}
                        onRetryWorkflow={(workflowId) => runWorkflow(workflowId)}
                        isStartNode={selectedWorkflow.id === startWorkflowId}
                        isRunning={isRunning}
                        onSetStartNode={setStartWorkflowId}
                        onDeleteWorkflow={handleDeleteWorkflow}
                    />
                ) : (
                    <p>Select a workflow to view its details.</p>
                )}
            </div>
        </main>
    );
}
