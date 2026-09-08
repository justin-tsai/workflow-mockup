import type { WorkflowNode, WorkflowEdge } from "../types/workflow";

export function wouldCreateCycle(
  edges: WorkflowEdge[],
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
    edges
      .filter((edge) => edge.source === workflowId)
      .forEach((edge) => pending.push(edge.target));
  }

  return false;
}

export function getExecutionOrder(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  startId: number,
) {
  const reachable = new Set<number>();
  const pending = [startId];

  while (pending.length > 0) {
    const workflowId = pending.shift();
    if (workflowId === undefined || reachable.has(workflowId)) continue;

    reachable.add(workflowId);
    edges
      .filter((edge) => edge.source === workflowId)
      .forEach((edge) => pending.push(edge.target));
  }

  const startNode = nodes.find((node) => node.id === startId);
  const remainingNodes = nodes
    .filter((node) => reachable.has(node.id) && node.id !== startId)
    .sort((left, right) => left.x - right.x || left.y - right.y);

  return startNode ? [startNode, ...remainingNodes] : remainingNodes;
}

export function getNextNodeId(nodes: WorkflowNode[]) {
  return Math.max(0, ...nodes.map((node) => node.id)) + 1;
}
