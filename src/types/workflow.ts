export type WorkflowStatus =
    | 'idle'
    | 'queued'
    | 'running'
    | 'completed'
    | 'failed'
    | 'blocked';

export type Workflow = {
    id: number;
    name: string;
    status: WorkflowStatus | null;
    description: string;
    duration?: number;
    startedAt?: string;
    x: number;
    y: number;
};

export type WorkflowConnection = {
    id: string;
    source: number;
    target: number;
};
