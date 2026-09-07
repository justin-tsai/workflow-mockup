import { useEffect, useMemo, useRef, useState } from 'react';
import ExecutionDetails from './components/ExecutionDetails';
import { workflows } from './data/workflows';
import type { Workflow, WorkflowConnection } from './types/workflow';
import WorkflowCanvas from './components/WorkflowCanvas';

export default function App() {
    const [workflowItems, setWorkflowItems] = useState<Workflow[]>(workflows);
    const [connections, setConnections] = useState<WorkflowConnection[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
    const completionTimersRef = useRef<Record<number, ReturnType<typeof window.setTimeout>>>({});

    const selectedWorkflow = useMemo(
        () => workflowItems.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
        [selectedWorkflowId, workflowItems],
    );

    useEffect(() => {
        const completionTimers = completionTimersRef.current;

        return () => {
            Object.values(completionTimers).forEach(window.clearTimeout);
        };
    }, []);

    const handleSelectWorkflow = (workflow: Workflow) => {
        setSelectedWorkflowId(workflow.id);
    };

    const handleRetryWorkflow = (workflowId: number) => {
        setWorkflowItems((currentWorkflows) =>
            currentWorkflows.map((workflow) =>
                workflow.id === workflowId
                    ? { ...workflow, status: 'running' }
                    : workflow,
            ),
        );

        if (completionTimersRef.current[workflowId]) {
            window.clearTimeout(completionTimersRef.current[workflowId]);
        }

        completionTimersRef.current[workflowId] = window.setTimeout(() => {
            setWorkflowItems((currentWorkflows) =>
                currentWorkflows.map((workflow) =>
                    workflow.id === workflowId
                        ? { ...workflow, status: 'completed' }
                        : workflow,
                ),
            );

            delete completionTimersRef.current[workflowId];
        }, 1200);
    };

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
                status: 'queued',
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

            <button type="button" onClick={handleCreateWorkflow}>
                Add Node
            </button>

            <div className="dashboard">
                <WorkflowCanvas
                    workflows={workflowItems}
                    connections={connections}
                    selectedWorkflowId={selectedWorkflowId}
                    onSelectWorkflow={handleSelectWorkflow}
                    onMoveWorkflow={handleMoveWorkflow}
                    onConnectWorkflows={handleConnectWorkflows}
                />

                {selectedWorkflow ? (
                    <ExecutionDetails
                        workflow={selectedWorkflow}
                        onRetryWorkflow={handleRetryWorkflow}
                    />
                ) : (
                    <p>Select a workflow to view its details.</p>
                )}
            </div>
        </main>
    );
}
