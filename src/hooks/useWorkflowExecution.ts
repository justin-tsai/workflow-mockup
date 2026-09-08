import { useCallback, useEffect, useRef, useState } from "react";
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowStatus,
} from "../types/workflow";
import { getExecutionOrder } from "../utils/workflowGraph";

type UpdateNodes = (update: (nodes: WorkflowNode[]) => WorkflowNode[]) => void;
type RunState = Exclude<WorkflowStatus, "idle" | "queued"> | "pending";

type UseWorkflowExecutionOptions = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updateNodes: UpdateNodes;
};

export function useWorkflowExecution({
  nodes,
  edges,
  updateNodes,
}: UseWorkflowExecutionOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const timersRef = useRef<
    Record<number, ReturnType<typeof window.setTimeout>>
  >({});
  const runTokenRef = useRef(0);

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach(window.clearTimeout);
      runTokenRef.current += 1;
    },
    [],
  );

  const runWorkflow = useCallback(
    (requestedStartId: number | null) => {
      if (requestedStartId === null || isRunning) return;

      Object.values(timersRef.current).forEach(window.clearTimeout);
      timersRef.current = {};
      const runToken = ++runTokenRef.current;
      const executionOrder = getExecutionOrder(nodes, edges, requestedStartId);
      if (executionOrder.length === 0) return;

      setIsRunning(true);
      const startedAt = new Date().toLocaleTimeString();
      const executionIds = new Set(executionOrder.map((node) => node.id));
      updateNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          ...(executionIds.has(node.id)
            ? { status: null, startedAt: undefined, duration: undefined }
            : {}),
        })),
      );

      const reachableIds = executionIds;
      const parentIds = new Map<number, number[]>();
      const runStates = new Map<number, RunState>();
      executionOrder.forEach((workflow) => {
        parentIds.set(workflow.id, []);
        runStates.set(workflow.id, "pending");
      });
      edges.forEach((edge) => {
        if (reachableIds.has(edge.source) && reachableIds.has(edge.target)) {
          parentIds.get(edge.target)?.push(edge.source);
        }
      });

      let activeWorkflows = 0;
      const markWorkflows = (ids: number[], status: WorkflowStatus) => {
        updateNodes((currentNodes) =>
          currentNodes.map((node) =>
            ids.includes(node.id) ? { ...node, status } : node,
          ),
        );
      };
      const finishRunIfComplete = () => {
        const unfinished = [...runStates.values()].some(
          (state) => state === "pending" || state === "running",
        );
        if (activeWorkflows === 0 && !unfinished) setIsRunning(false);
      };

      const scheduleReadyWorkflows = () => {
        if (runTokenRef.current !== runToken) return;

        let changed = true;
        while (changed) {
          changed = false;
          [...runStates.entries()].forEach(([workflowId, state]) => {
            if (state !== "pending") return;
            const parentBlocked = (parentIds.get(workflowId) ?? []).some(
              (parentId) => {
                const parentState = runStates.get(parentId);
                return parentState === "failed" || parentState === "blocked";
              },
            );
            if (parentBlocked) {
              runStates.set(workflowId, "blocked");
              markWorkflows([workflowId], "blocked");
              changed = true;
            }
          });
        }

        const readyWorkflows = executionOrder.filter((workflow) => {
          if (runStates.get(workflow.id) !== "pending") return false;
          if (workflow.id === requestedStartId) return true;
          return (parentIds.get(workflow.id) ?? []).every(
            (parentId) => runStates.get(parentId) === "completed",
          );
        });

        readyWorkflows.forEach((workflow) => {
          const duration = Math.floor(Math.random() * 9) + 2;
          runStates.set(workflow.id, "running");
          activeWorkflows += 1;
          updateNodes((currentNodes) =>
            currentNodes.map((currentNode) =>
              currentNode.id === workflow.id
                ? { ...currentNode, status: "running", startedAt, duration }
                : currentNode,
            ),
          );

          timersRef.current[workflow.id] = window.setTimeout(() => {
            if (runTokenRef.current !== runToken) return;
            const failed = Math.random() < 0.1;
            runStates.set(workflow.id, failed ? "failed" : "completed");
            activeWorkflows -= 1;
            markWorkflows([workflow.id], failed ? "failed" : "completed");
            delete timersRef.current[workflow.id];
            scheduleReadyWorkflows();
          }, duration * 1000);
        });

        const hasPendingWorkflows = [...runStates.values()].some(
          (state) => state === "pending",
        );
        if (
          activeWorkflows === 0 &&
          hasPendingWorkflows &&
          readyWorkflows.length === 0
        ) {
          const blockedIds = [...runStates.entries()]
            .filter(([, state]) => state === "pending")
            .map(([workflowId]) => workflowId);
          blockedIds.forEach((workflowId) =>
            runStates.set(workflowId, "blocked"),
          );
          markWorkflows(blockedIds, "blocked");
        }
        finishRunIfComplete();
      };

      scheduleReadyWorkflows();
    },
    [edges, isRunning, nodes, updateNodes],
  );

  return { isRunning, runWorkflow };
}
