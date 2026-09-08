export type WorkflowStatus =
  "idle" | "queued" | "running" | "completed" | "failed" | "blocked";

export type WorkflowNode = {
  id: number;
  name: string;
  status: WorkflowStatus | null;
  description: string;
  duration?: number;
  startedAt?: string;
  x: number;
  y: number;
};

export type WorkflowEdge = {
  id: string;
  source: number;
  target: number;
};

export type Workflow = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  startNodeId: number | null;
};
