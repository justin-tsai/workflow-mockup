import { useCallback, useEffect, useMemo, useState } from "react";
import { workflow as initialWorkflow } from "../data/workflows";
import { useWorkflowExecution } from "./useWorkflowExecution";
import type { Workflow, WorkflowNode } from "../types/workflow";
import { getNextNodeId, wouldCreateCycle } from "../utils/workflowGraph";

type ConnectionError = { id: number; message: string };
type InspectorSelection =
  { type: "node"; id: number } | { type: "edge"; id: string } | null;

export function useWorkflowEditor() {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow);
  const [inspectorSelection, setInspectorSelection] =
    useState<InspectorSelection>(null);
  const [connectionError, setConnectionError] =
    useState<ConnectionError | null>(null);

  useEffect(() => {
    if (!connectionError) return;
    const timeout = window.setTimeout(() => setConnectionError(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [connectionError]);

  const selectedNodeId =
    inspectorSelection?.type === "node" ? inspectorSelection.id : null;
  const selectedEdgeId =
    inspectorSelection?.type === "edge" ? inspectorSelection.id : null;
  const selectedNode = useMemo(
    () => workflow.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [selectedNodeId, workflow.nodes],
  );
  const selectedEdge = useMemo(
    () => workflow.edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [selectedEdgeId, workflow.edges],
  );
  const selectedEdgeSource = useMemo(
    () =>
      workflow.nodes.find((node) => node.id === selectedEdge?.source) ?? null,
    [selectedEdge, workflow.nodes],
  );
  const selectedEdgeTarget = useMemo(
    () =>
      workflow.nodes.find((node) => node.id === selectedEdge?.target) ?? null,
    [selectedEdge, workflow.nodes],
  );

  const { isRunning, runWorkflow } = useWorkflowExecution({
    nodes: workflow.nodes,
    edges: workflow.edges,
    updateNodes: (update) =>
      setWorkflow((current) => ({ ...current, nodes: update(current.nodes) })),
  });

  const handleCreateNode = useCallback(() => {
    setWorkflow((current) => {
      const id = getNextNodeId(current.nodes);
      const node: WorkflowNode = {
        id,
        name: `New node ${id}`,
        status: null,
        description: "A new workflow node.",
        x: 100 + current.nodes.length * 30,
        y: 100 + current.nodes.length * 30,
      };
      return { ...current, nodes: [...current.nodes, node] };
    });
  }, []);

  const handleMoveNode = useCallback((nodeId: number, x: number, y: number) => {
    setWorkflow((current) => ({
      ...current,
      nodes: current.nodes.map((node) =>
        node.id === nodeId ? { ...node, x, y } : node,
      ),
    }));
  }, []);

  const handleUpdateNode = useCallback(
    (
      nodeId: number,
      updates: Partial<Pick<WorkflowNode, "name" | "description">>,
    ) => {
      setWorkflow((current) => ({
        ...current,
        nodes: current.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node,
        ),
      }));
    },
    [],
  );

  const handleConnectNodes = useCallback(
    (source: number, target: number) => {
      if (wouldCreateCycle(workflow.edges, source, target)) {
        setConnectionError({
          id: Date.now(),
          message:
            "Cannot connect these nodes because it would create a cycle.",
        });
        return;
      }
      setWorkflow((current) => ({
        ...current,
        edges: current.edges.some(
          (edge) => edge.source === source && edge.target === target,
        )
          ? current.edges
          : [...current.edges, { id: `${source}-${target}`, source, target }],
      }));
    },
    [workflow.edges],
  );

  const handleDeleteEdges = useCallback((edgeIds: string[]) => {
    const ids = new Set(edgeIds);
    setWorkflow((current) => ({
      ...current,
      edges: current.edges.filter((edge) => !ids.has(edge.id)),
    }));
    setInspectorSelection((selection) =>
      selection?.type === "edge" && ids.has(selection.id) ? null : selection,
    );
  }, []);

  const handleDeleteNodes = useCallback(
    (nodeIds: number[]) => {
      const ids = new Set(nodeIds);
      setWorkflow((current) => {
        const nodes = current.nodes.filter((node) => !ids.has(node.id));
        return {
          ...current,
          nodes,
          edges: current.edges.filter(
            (edge) => !ids.has(edge.source) && !ids.has(edge.target),
          ),
          startNodeId:
            current.startNodeId !== null && ids.has(current.startNodeId)
              ? (nodes[0]?.id ?? null)
              : current.startNodeId,
        };
      });
      setInspectorSelection((selection) => {
        if (selection?.type === "node" && ids.has(selection.id)) return null;
        if (
          selection?.type === "edge" &&
          workflow.edges.some(
            (edge) =>
              edge.id === selection.id &&
              (ids.has(edge.source) || ids.has(edge.target)),
          )
        )
          return null;
        return selection;
      });
    },
    [workflow.edges],
  );

  const selectNode = useCallback(
    (node: WorkflowNode) =>
      setInspectorSelection({ type: "node", id: node.id }),
    [],
  );
  const selectEdge = useCallback(
    (edgeId: string | null) =>
      setInspectorSelection(edgeId ? { type: "edge", id: edgeId } : null),
    [],
  );
  const setStartNodeId = useCallback(
    (nodeId: number) =>
      setWorkflow((current) => ({ ...current, startNodeId: nodeId })),
    [],
  );

  return {
    workflow,
    nodes: workflow.nodes,
    edges: workflow.edges,
    selectedNodeId,
    selectedEdgeId,
    startNodeId: workflow.startNodeId,
    connectionError,
    selectedNode,
    selectedEdge,
    selectedEdgeSource,
    selectedEdgeTarget,
    setStartNodeId,
    isRunning,
    runWorkflow,
    handleCreateNode,
    handleMoveNode,
    handleUpdateNode,
    handleConnectNodes,
    handleDeleteEdges,
    handleDeleteNodes,
    selectNode,
    selectEdge,
  };
}
