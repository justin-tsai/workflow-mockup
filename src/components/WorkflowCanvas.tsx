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
} from '@xyflow/react';
import { useEffect, useMemo, useRef } from 'react';
import type { Workflow, WorkflowConnection } from '../types/workflow';
import WorkflowNode, { type WorkflowNode as WorkflowNodeType } from './WorkflowNode';
import SmartEdge, {
    DEFAULT_NODE_HEIGHT,
    DEFAULT_NODE_WIDTH,
    EDGE_CLEARANCE,
} from './SmartEdge';

type WorkflowCanvasProps = {
    workflows: Workflow[];
    connections: WorkflowConnection[];
    selectedWorkflowId: number | null;
    startWorkflowId: number | null;
    onSelectWorkflow: (workflow: Workflow) => void;
    onMoveWorkflow: (workflowId: number, x: number, y: number) => void;
    onUpdateWorkflow: (workflowId: number, updates: Partial<Pick<Workflow, 'name' | 'description'>>) => void;
    onConnectWorkflows: (source: number, target: number) => void;
    onDeleteConnections: (connectionIds: string[]) => void;
    onDeleteWorkflows: (workflowIds: number[]) => void;
    selectedConnectionId: string | null;
    onSelectConnection: (connectionId: string | null) => void;
};

const nodeTypes: NodeTypes = { workflow: WorkflowNode };
const edgeTypes = { smart: SmartEdge };

export default function WorkflowCanvas({
    workflows,
    connections,
    selectedWorkflowId,
    startWorkflowId,
    onSelectWorkflow,
    onMoveWorkflow,
    onUpdateWorkflow,
    onConnectWorkflows,
    onDeleteConnections,
    onDeleteWorkflows,
    selectedConnectionId,
    onSelectConnection,
}: WorkflowCanvasProps) {
    const canvasRef = useRef<HTMLElement>(null);
    const reactFlowRef = useRef<ReactFlowInstance<WorkflowNodeType>>(null);
    const initialNodes = useMemo<WorkflowNodeType[]>(
        () => workflows.map((workflow) => ({
            id: String(workflow.id),
            type: 'workflow',
            position: { x: workflow.x, y: workflow.y },
            data: {
                workflow,
                isStart: workflow.id === startWorkflowId,
                onUpdateWorkflow,
            },
            selected: workflow.id === selectedWorkflowId,
        })),
        [onUpdateWorkflow, selectedWorkflowId, startWorkflowId, workflows],
    );
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

    const getNodeSize = (workflowId: number) => {
        const node = nodes.find((candidate) => candidate.id === String(workflowId));
        return {
            width: node?.measured?.width ?? node?.width ?? DEFAULT_NODE_WIDTH,
            height: node?.measured?.height ?? node?.height ?? DEFAULT_NODE_HEIGHT,
        };
    };

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

    const edges: Edge[] = connections.map((connection) => {
        const selected = connection.id === selectedConnectionId;
        const sourceWorkflow = workflows.find((workflow) => workflow.id === connection.source);
        const targetWorkflow = workflows.find((workflow) => workflow.id === connection.target);
        const sourceSize = getNodeSize(connection.source);
        const targetSize = getNodeSize(connection.target);
        const routeStart = Math.min(sourceWorkflow?.x ?? 0, targetWorkflow?.x ?? 0);
        const routeEnd = Math.max(
            (sourceWorkflow?.x ?? 0) + sourceSize.width,
            (targetWorkflow?.x ?? 0) + targetSize.width,
        );
        const routeTop = Math.min(sourceWorkflow?.y ?? 0, targetWorkflow?.y ?? 0);
        const routeBottom = Math.max(
            (sourceWorkflow?.y ?? 0) + sourceSize.height,
            (targetWorkflow?.y ?? 0) + targetSize.height,
        );
        const blockingWorkflows = workflows.filter((workflow) =>
            workflow.id !== connection.source &&
            workflow.id !== connection.target &&
            workflow.x < routeEnd &&
            workflow.x + getNodeSize(workflow.id).width > routeStart &&
            workflow.y < routeBottom &&
            workflow.y + getNodeSize(workflow.id).height > routeTop,
        );
        const routeY = blockingWorkflows.length > 0
            ? Math.max(...blockingWorkflows.map((workflow) => workflow.y + getNodeSize(workflow.id).height)) + EDGE_CLEARANCE
            : undefined;

        return {
            id: connection.id,
            source: String(connection.source),
            target: String(connection.target),
            type: 'smart',
            data: { routeY },
            selected,
            interactionWidth: 24,
            style: { stroke: selected ? '#2563eb' : '#c9cdd3', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: selected ? '#2563eb' : '#c9cdd3' },
        };
    });

    const handleConnect = (connection: Connection) => {
        if (connection.source && connection.target) {
            onConnectWorkflows(Number(connection.source), Number(connection.target));
        }
    };

    return (
        <section ref={canvasRef} className="workflow-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onNodeDragStop={(_, node) => onMoveWorkflow(Number(node.id), node.position.x, node.position.y)}
                onConnect={handleConnect}
                onEdgeClick={(_, edge) => onSelectConnection(edge.id)}
                onEdgesDelete={(deletedEdges) => {
                    onSelectConnection(null);
                    onDeleteConnections(deletedEdges.map((edge) => edge.id));
                }}
                onNodesDelete={(deletedNodes) => onDeleteWorkflows(deletedNodes.map((node) => Number(node.id)))}
                deleteKeyCode="Delete"
                onNodeClick={(_, node) => {
                    onSelectConnection(null);
                    const workflow = workflows.find((candidate) => candidate.id === Number(node.id));
                    if (workflow) onSelectWorkflow(workflow);
                }}
                onPaneClick={() => onSelectConnection(null)}
                onInit={(instance) => { reactFlowRef.current = instance; }}
                defaultEdgeOptions={{
                    type: 'smart',
                    style: { stroke: '#c9cdd3', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#c9cdd3' },
                }}
                connectionLineStyle={{ stroke: '#c9cdd3', strokeWidth: 2 }}
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
