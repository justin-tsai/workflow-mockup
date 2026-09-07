import { useEffect, useMemo, useRef, useState } from 'react';
import WorkflowList from './components/WorkflowList';
import ExecutionDetails from './components/ExecutionDetails';
import { workflows } from './data/workflows';
import type { Workflow } from './types/workflow';
import WorkflowCanvas from './components/WorkflowCanvas';

export default function App() {
    const [workflowItems, setWorkflowItems] = useState<Workflow[]>(workflows);
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

    return (
        <main>
            <h1>Workflow Dashboard</h1>

            <div className="dashboard">
                <WorkflowCanvas
                    workflows={workflowItems}
                    selectedWorkflowId={selectedWorkflowId}
                    onSelectWorkflow={handleSelectWorkflow}
                    onMoveWorkflow={handleMoveWorkflow}
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
