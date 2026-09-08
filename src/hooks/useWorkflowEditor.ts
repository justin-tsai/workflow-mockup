import { useCallback, useEffect, useMemo, useState } from 'react';
import { workflows as initialWorkflows } from '../data/workflows';
import { useWorkflowExecution } from './useWorkflowExecution';
import type { Workflow, WorkflowConnection } from '../types/workflow';
import { getNextWorkflowId, wouldCreateCycle } from '../utils/workflowGraph';

type ConnectionError = { id: number; message: string };

type InspectorSelection =
    | { type: 'node'; id: number }
    | { type: 'connection'; id: string }
    | null;

export function useWorkflowEditor() {
    const [workflowItems, setWorkflowItems] = useState<Workflow[]>(initialWorkflows);
    const [connections, setConnections] = useState<WorkflowConnection[]>(() =>
        initialWorkflows.slice(0, -1).map((workflow, index) => ({
            id: `${workflow.id}-${initialWorkflows[index + 1].id}`,
            source: workflow.id,
            target: initialWorkflows[index + 1].id,
        })),
    );
    const [inspectorSelection, setInspectorSelection] = useState<InspectorSelection>(null);
    const [startWorkflowId, setStartWorkflowId] = useState<number | null>(initialWorkflows[0]?.id ?? null);
    const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);

    useEffect(() => {
        if (!connectionError) return;

        const timeout = window.setTimeout(() => setConnectionError(null), 3500);
        return () => window.clearTimeout(timeout);
    }, [connectionError]);

    const selectedWorkflowId = inspectorSelection?.type === 'node' ? inspectorSelection.id : null;
    const selectedConnectionId = inspectorSelection?.type === 'connection' ? inspectorSelection.id : null;
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
            currentConnections.some((connection) => connection.source === source && connection.target === target)
                ? currentConnections
                : [...currentConnections, { id: `${source}-${target}`, source, target }],
        );
    }, [connections]);

    const handleDeleteConnections = useCallback((connectionIds: string[]) => {
        const ids = new Set(connectionIds);
        setConnections((currentConnections) => currentConnections.filter(
            (connection) => !ids.has(connection.id),
        ));
        setInspectorSelection((currentSelection) =>
            currentSelection?.type === 'connection' && ids.has(currentSelection.id)
                ? null
                : currentSelection,
        );
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
        setInspectorSelection((currentSelection) => {
            if (currentSelection?.type === 'node' && ids.has(currentSelection.id)) return null;
            if (currentSelection?.type === 'connection' && connections.some(
                (connection) => connection.id === currentSelection.id &&
                    (ids.has(connection.source) || ids.has(connection.target)),
            )) return null;
            return currentSelection;
        });
    }, [connections]);

    const handleDeleteWorkflow = useCallback((workflowId: number) => {
        handleDeleteWorkflows([workflowId]);
    }, [handleDeleteWorkflows]);

    const selectWorkflow = useCallback((workflow: Workflow) => {
        setInspectorSelection({ type: 'node', id: workflow.id });
    }, []);

    const selectConnection = useCallback((connectionId: string | null) => {
        setInspectorSelection(connectionId ? { type: 'connection', id: connectionId } : null);
    }, []);

    return {
        workflowItems,
        connections,
        selectedWorkflowId,
        selectedConnectionId,
        startWorkflowId,
        connectionError,
        selectedWorkflow,
        selectedConnection,
        selectedConnectionSource,
        selectedConnectionTarget,
        setStartWorkflowId,
        isRunning,
        runWorkflow,
        handleCreateWorkflow,
        handleMoveWorkflow,
        handleUpdateWorkflow,
        handleConnectWorkflows,
        handleDeleteConnections,
        handleDeleteWorkflows,
        handleDeleteWorkflow,
        selectWorkflow,
        selectConnection,
    };
}
