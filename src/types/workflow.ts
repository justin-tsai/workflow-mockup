export type WorkflowStatus =
    | 'queued'
    | 'running'
    | 'completed'
    | 'failed';

export type Workflow = {
    id: number;
    name: string;
    status: WorkflowStatus;
    description: string;
    duration: number;
    startedAt: string;
    x: number;
    y: number;
};