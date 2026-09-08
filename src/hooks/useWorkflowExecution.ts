import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workflow, WorkflowConnection, WorkflowStatus } from '../types/workflow';
import { getExecutionOrder } from '../utils/workflowGraph';

type UpdateWorkflows = (update: (workflows: Workflow[]) => Workflow[]) => void;
type RunState = Exclude<WorkflowStatus, 'idle' | 'queued'> | 'pending';

type UseWorkflowExecutionOptions = {
    workflows: Workflow[];
    connections: WorkflowConnection[];
    updateWorkflows: UpdateWorkflows;
};

export function useWorkflowExecution({
    workflows,
    connections,
    updateWorkflows,
}: UseWorkflowExecutionOptions) {
    const [isRunning, setIsRunning] = useState(false);
    const timersRef = useRef<Record<number, ReturnType<typeof window.setTimeout>>>({});
    const runTokenRef = useRef(0);

    useEffect(() => () => {
        Object.values(timersRef.current).forEach(window.clearTimeout);
        runTokenRef.current += 1;
    }, []);

    const runWorkflow = useCallback(
        (requestedStartId: number | null) => {
            if (requestedStartId === null || isRunning) return;

            Object.values(timersRef.current).forEach(window.clearTimeout);
            timersRef.current = {};
            const runToken = ++runTokenRef.current;
            const executionOrder = getExecutionOrder(workflows, connections, requestedStartId);
            if (executionOrder.length === 0) return;

            setIsRunning(true);
            const startedAt = new Date().toLocaleTimeString();
            const executionIds = new Set(executionOrder.map((workflow) => workflow.id));
            updateWorkflows((currentWorkflows) => currentWorkflows.map((workflow) => ({
                ...workflow,
                ...(executionIds.has(workflow.id)
                    ? { status: null, startedAt: undefined, duration: undefined }
                    : {}),
            })));

            const reachableIds = executionIds;
            const parentIds = new Map<number, number[]>();
            const runStates = new Map<number, RunState>();
            executionOrder.forEach((workflow) => {
                parentIds.set(workflow.id, []);
                runStates.set(workflow.id, 'pending');
            });
            connections.forEach((connection) => {
                if (reachableIds.has(connection.source) && reachableIds.has(connection.target)) {
                    parentIds.get(connection.target)?.push(connection.source);
                }
            });

            let activeWorkflows = 0;
            const markWorkflows = (ids: number[], status: WorkflowStatus) => {
                updateWorkflows((currentWorkflows) => currentWorkflows.map((workflow) =>
                    ids.includes(workflow.id) ? { ...workflow, status } : workflow,
                ));
            };
            const finishRunIfComplete = () => {
                const unfinished = [...runStates.values()].some((state) =>
                    state === 'pending' || state === 'running',
                );
                if (activeWorkflows === 0 && !unfinished) setIsRunning(false);
            };

            const scheduleReadyWorkflows = () => {
                if (runTokenRef.current !== runToken) return;

                let changed = true;
                while (changed) {
                    changed = false;
                    [...runStates.entries()].forEach(([workflowId, state]) => {
                        if (state !== 'pending') return;
                        const parentBlocked = (parentIds.get(workflowId) ?? []).some((parentId) => {
                            const parentState = runStates.get(parentId);
                            return parentState === 'failed' || parentState === 'blocked';
                        });
                        if (parentBlocked) {
                            runStates.set(workflowId, 'blocked');
                            markWorkflows([workflowId], 'blocked');
                            changed = true;
                        }
                    });
                }

                const readyWorkflows = executionOrder.filter((workflow) => {
                    if (runStates.get(workflow.id) !== 'pending') return false;
                    if (workflow.id === requestedStartId) return true;
                    return (parentIds.get(workflow.id) ?? []).every(
                        (parentId) => runStates.get(parentId) === 'completed',
                    );
                });

                readyWorkflows.forEach((workflow) => {
                    const duration = Math.floor(Math.random() * 9) + 2;
                    runStates.set(workflow.id, 'running');
                    activeWorkflows += 1;
                    updateWorkflows((currentWorkflows) => currentWorkflows.map((currentWorkflow) =>
                        currentWorkflow.id === workflow.id
                            ? { ...currentWorkflow, status: 'running', startedAt, duration }
                            : currentWorkflow,
                    ));

                    timersRef.current[workflow.id] = window.setTimeout(() => {
                        if (runTokenRef.current !== runToken) return;
                        const failed = Math.random() < 0.1;
                        runStates.set(workflow.id, failed ? 'failed' : 'completed');
                        activeWorkflows -= 1;
                        markWorkflows([workflow.id], failed ? 'failed' : 'completed');
                        delete timersRef.current[workflow.id];
                        scheduleReadyWorkflows();
                    }, duration * 1000);
                });

                const hasPendingWorkflows = [...runStates.values()].some((state) => state === 'pending');
                if (activeWorkflows === 0 && hasPendingWorkflows && readyWorkflows.length === 0) {
                    const blockedIds = [...runStates.entries()]
                        .filter(([, state]) => state === 'pending')
                        .map(([workflowId]) => workflowId);
                    blockedIds.forEach((workflowId) => runStates.set(workflowId, 'blocked'));
                    markWorkflows(blockedIds, 'blocked');
                }
                finishRunIfComplete();
            };

            scheduleReadyWorkflows();
        },
        [connections, isRunning, updateWorkflows, workflows],
    );

    return { isRunning, runWorkflow };
}
