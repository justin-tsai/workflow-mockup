import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useNodesState,
  type Connection,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useEffect, useMemo, useRef } from "react";
import type {
  WorkflowNode as WorkflowNodeModel,
  WorkflowEdge,
} from "../types/workflow";
import WorkflowNode, { type WorkflowFlowNode } from "./WorkflowNode";

type WorkflowCanvasProps = {
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdge[];
  selectedNodeId: number | null;
  startNodeId: number | null;
  onSelectNode: (node: WorkflowNodeModel) => void;
  onMoveNode: (nodeId: number, x: number, y: number) => void;
  onUpdateNode: (
    nodeId: number,
    updates: Partial<Pick<WorkflowNodeModel, "name" | "description">>,
  ) => void;
  onConnectNodes: (source: number, target: number) => void;
  onDeleteEdges: (edgeIds: string[]) => void;
  onDeleteNodes: (nodeIds: number[]) => void;
  selectedEdgeId: string | null;
  onSelectEdge: (edgeId: string | null) => void;
  isRunning: boolean;
};

const nodeTypes: NodeTypes = { workflow: WorkflowNode };

export default function WorkflowCanvas({
  nodes: workflowNodes,
  edges: workflowEdges,
  selectedNodeId,
  startNodeId,
  onSelectNode,
  onMoveNode,
  onUpdateNode,
  onConnectNodes,
  onDeleteEdges,
  onDeleteNodes,
  selectedEdgeId,
  onSelectEdge,
  isRunning,
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLElement>(null);
  const reactFlowRef = useRef<ReactFlowInstance<WorkflowFlowNode>>(null);
  const initialNodes = useMemo<WorkflowFlowNode[]>(
    () =>
      workflowNodes.map((node) => ({
        id: String(node.id),
        type: "workflow",
        position: { x: node.x, y: node.y },
        data: {
          node,
          isStart: node.id === startNodeId,
          isRunning,
          onSelectNode,
          onUpdateNode,
        },
        selected: node.id === selectedNodeId,
      })),
    [isRunning, onSelectNode, onUpdateNode, selectedNodeId, startNodeId, workflowNodes],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver(() => {
      reactFlowRef.current?.fitView({ padding: 0.15, duration: 0 });
    });
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  const edges: Edge[] = workflowEdges.map((edge) => {
    const selected = edge.id === selectedEdgeId;

    return {
      id: edge.id,
      source: String(edge.source),
      target: String(edge.target),
      type: "smoothstep",
      selected,
      interactionWidth: 24,
      style: { stroke: selected ? "#2563eb" : "#c9cdd3", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selected ? "#2563eb" : "#c9cdd3",
      },
    };
  });

  const handleConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      onConnectNodes(Number(connection.source), Number(connection.target));
    }
  };

  return (
    <section
      ref={canvasRef}
      className={`workflow-canvas ${isRunning ? "workflow-canvas-locked" : ""}`}
      aria-busy={isRunning}
    >
      {isRunning && <div className="workflow-lock-badge">Workflow locked while running</div>}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={(_, node) =>
          onMoveNode(Number(node.id), node.position.x, node.position.y)
        }
        onConnect={handleConnect}
        nodesDraggable={!isRunning}
        nodesConnectable={!isRunning}
        onEdgeClick={(_, edge) => onSelectEdge(edge.id)}
        onEdgesDelete={(deletedEdges) => {
          if (isRunning) return;
          onSelectEdge(null);
          onDeleteEdges(deletedEdges.map((edge) => edge.id));
        }}
        onNodesDelete={(deletedNodes) => {
          if (isRunning) return;
          onDeleteNodes(deletedNodes.map((node) => Number(node.id)));
        }}
        deleteKeyCode={isRunning ? null : "Delete"}
        onPaneClick={() => onSelectEdge(null)}
        onInit={(instance) => {
          reactFlowRef.current = instance;
        }}
        defaultEdgeOptions={{
          type: "smart",
          style: { stroke: "#c9cdd3", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#c9cdd3" },
        }}
        connectionLineStyle={{ stroke: "#c9cdd3", strokeWidth: 2 }}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background color="#d9dce1" gap={24} />
        <Controls />
      </ReactFlow>
    </section>
  );
}
