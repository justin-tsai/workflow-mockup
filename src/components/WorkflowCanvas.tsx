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
                    onSelectWorkflow,
                    onUpdateWorkflow,
                },
            selected: workflow.id === selectedWorkflowId,
        })),
        [onSelectWorkflow, onUpdateWorkflow, selectedWorkflowId, startWorkflowId, workflows],
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

    const edges: Edge[] = connections.map((connection) => {
        const selected = connection.id === selectedConnectionId;

        return {
            id: connection.id,
            source: String(connection.source),
            target: String(connection.target),
            type: 'smoothstep',
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
