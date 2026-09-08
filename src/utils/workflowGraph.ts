import type { Workflow, WorkflowConnection } from '../types/workflow';

export function wouldCreateCycle(
    connections: WorkflowConnection[],
    source: number,
    target: number,
) {
    if (source === target) return true;

    const pending = [target];
    const visited = new Set<number>();

    while (pending.length > 0) {
        const workflowId = pending.pop();
        if (workflowId === undefined || visited.has(workflowId)) continue;
        if (workflowId === source) return true;

        visited.add(workflowId);
        connections
            .filter((connection) => connection.source === workflowId)
            .forEach((connection) => pending.push(connection.target));
    }

    return false;
}

export function getExecutionOrder(
    workflows: Workflow[],
    connections: WorkflowConnection[],
    startId: number,
) {
    const reachable = new Set<number>();
    const pending = [startId];

    while (pending.length > 0) {
        const workflowId = pending.shift();
        if (workflowId === undefined || reachable.has(workflowId)) continue;

        reachable.add(workflowId);
        connections
            .filter((connection) => connection.source === workflowId)
            .forEach((connection) => pending.push(connection.target));
    }

    const startWorkflow = workflows.find((workflow) => workflow.id === startId);
    const remainingWorkflows = workflows
        .filter((workflow) => reachable.has(workflow.id) && workflow.id !== startId)
        .sort((left, right) => left.x - right.x || left.y - right.y);

    return startWorkflow ? [startWorkflow, ...remainingWorkflows] : remainingWorkflows;
}

export function getNextWorkflowId(workflows: Workflow[]) {
    return Math.max(0, ...workflows.map((workflow) => workflow.id)) + 1;
}
