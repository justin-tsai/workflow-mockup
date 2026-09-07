import { useEffect, useMemo, useRef, useState } from 'react';
import ExecutionDetails from './components/ExecutionDetails';
import { workflows } from './data/workflows';
import type { Workflow, WorkflowConnection } from './types/workflow';
import WorkflowCanvas from './components/WorkflowCanvas';

export default function App() {
    const [workflowItems, setWorkflowItems] = useState<Workflow[]>(workflows);
    const [connections, setConnections] = useState<WorkflowConnection[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
    const [startWorkflowId, setStartWorkflowId] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const runTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const runTokenRef = useRef(0);

    const selectedWorkflow = useMemo(
        () => workflowItems.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
        [selectedWorkflowId, workflowItems],
    );

    useEffect(() => {
        return () => {
            if (runTimerRef.current) {
                window.clearTimeout(runTimerRef.current);
            }
            runTokenRef.current += 1;
        };
    }, []);

    const handleSelectWorkflow = (workflow: Workflow) => {
        setSelectedWorkflowId(workflow.id);
    };

    const handleRetryWorkflow = (workflowId: number) => {
        handleRunWorkflow(startWorkflowId ?? workflowId);
    };

    const getExecutionOrder = (startId: number) => {
        const reachable = new Set<number>();
        const pending = [startId];

        while (pending.length > 0) {
            const workflowId = pending.shift();
            if (workflowId === undefined || reachable.has(workflowId)) {
                continue;
            }

            reachable.add(workflowId);
            connections
                .filter((connection) => connection.source === workflowId)
                .forEach((connection) => pending.push(connection.target));
        }

        const startWorkflow = workflowItems.find(
            (workflow) => workflow.id === startId,
        );
        const remainingWorkflows = workflowItems
            .filter(
                (workflow) =>
                    reachable.has(workflow.id) && workflow.id !== startId,
            )
            .sort((left, right) => left.x - right.x || left.y - right.y);

        return startWorkflow
            ? [startWorkflow, ...remainingWorkflows]
            : remainingWorkflows;
    };

    function handleRunWorkflow(requestedStartId: number | null) {
        if (requestedStartId === null || isRunning) {
            return;
        }

        if (runTimerRef.current) {
            window.clearTimeout(runTimerRef.current);
        }

        const runToken = runTokenRef.current + 1;
        runTokenRef.current = runToken;
        const executionOrder = getExecutionOrder(requestedStartId);

        if (executionOrder.length === 0) {
            return;
        }

        setIsRunning(true);
        setWorkflowItems((currentWorkflows) =>
            currentWorkflows.map((workflow) => ({
                ...workflow,
                status: undefined,
                startedAt: 'Not started',
                duration: 0,
            })),
        );

        const runNextWorkflow = (index: number) => {
            if (runTokenRef.current !== runToken) {
                return;
            }

            const workflow = executionOrder[index];
            const duration = Math.floor(Math.random() * 9) + 2;

            setWorkflowItems((currentWorkflows) =>
                currentWorkflows.map((currentWorkflow) =>
                    currentWorkflow.id === workflow.id
                        ? {
                              ...currentWorkflow,
                              status: 'running',
                              startedAt: new Date().toLocaleTimeString(),
                              duration,
                          }
                        : currentWorkflow,
                ),
            );

            runTimerRef.current = window.setTimeout(() => {
                if (runTokenRef.current !== runToken) {
                    return;
                }

                const failed = Math.random() < 0.1;
                setWorkflowItems((currentWorkflows) =>
                    currentWorkflows.map((currentWorkflow) =>
                        currentWorkflow.id === workflow.id
                            ? {
                                  ...currentWorkflow,
                                  status: failed ? 'failed' : 'completed',
                              }
                            : currentWorkflow,
                    ),
                );

                if (failed || index === executionOrder.length - 1) {
                    setIsRunning(false);
                    return;
                }

                runNextWorkflow(index + 1);
            }, duration * 1000);
        };

        runNextWorkflow(0);
    }

    const handleMoveWorkflow = (
        workflowId: number,
        x: number,
        y: number,
    ) => {
        setWorkflowItems((currentWorkflows) =>
            currentWorkflows.map((workflow) =>
                workflow.id === workflowId
                    ? { ...workflow, x, y }
                    : workflow,
            ),
        );
    };

    const handleCreateWorkflow = () => {
        setWorkflowItems((currentWorkflows) => {
            const nextId =
                Math.max(
                    0,
                    ...currentWorkflows.map((workflow) => workflow.id),
                ) + 1;

            const newWorkflow: Workflow = {
                id: nextId,
                name: `New workflow ${nextId}`,
                description: 'A new workflow.',
                startedAt: 'Not started',
                duration: 0,
                x: 100 + currentWorkflows.length * 30,
                y: 100 + currentWorkflows.length * 30,
            };

            return [...currentWorkflows, newWorkflow];
        });
    };

    const handleConnectWorkflows = (source: number, target: number) => {
        if (source === target) {
            return;
        }

        setConnections((currentConnections) => {
            if (
                currentConnections.some(
                    (connection) =>
                        connection.source === source &&
                        connection.target === target,
                )
            ) {
                return currentConnections;
            }

            return [
                ...currentConnections,
                {
                    id: `${source}-${target}`,
                    source,
                    target,
                },
            ];
        });
    };

    return (
        <main>
            <h1>Workflow Dashboard</h1>

            <div className="workflow-actions">
                <button
                    type="button"
                    onClick={() => handleRunWorkflow(startWorkflowId)}
                    disabled={isRunning || startWorkflowId === null}
                >
                    {isRunning ? 'Running...' : 'Run'}
                </button>
                <button type="button" onClick={handleCreateWorkflow}>
                    Add Node
                </button>
            </div>

            <div className="dashboard">
                <WorkflowCanvas
                    workflows={workflowItems}
                    connections={connections}
                    selectedWorkflowId={selectedWorkflowId}
                    startWorkflowId={startWorkflowId}
                    onSelectWorkflow={handleSelectWorkflow}
                    onMoveWorkflow={handleMoveWorkflow}
                    onConnectWorkflows={handleConnectWorkflows}
                />

                {selectedWorkflow ? (
                    <ExecutionDetails
                        workflow={selectedWorkflow}
                        onRetryWorkflow={handleRetryWorkflow}
                        isStartNode={selectedWorkflow.id === startWorkflowId}
                        onSetStartNode={setStartWorkflowId}
                    />
                ) : (
                    <p>Select a workflow to view its details.</p>
                )}
            </div>
        </main>
    );
}
