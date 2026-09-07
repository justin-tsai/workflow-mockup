import {
    Background,
    Controls,
    Handle,
    MarkerType,
    Position,
    ReactFlow,
    useNodesState,
    type Connection,
    type Edge,
    type Node,
    type NodeProps,
    type NodeTypes,
} from '@xyflow/react';
import { useEffect, useMemo } from 'react';
import type { Workflow, WorkflowConnection } from '../types/workflow';

type WorkflowNodeData = {
    workflow: Workflow;
    isStart: boolean;
};

type WorkflowNode = Node<WorkflowNodeData, 'workflow'>;

type WorkflowCanvasProps = {
    workflows: Workflow[];
    connections: WorkflowConnection[];
    selectedWorkflowId: number | null;
    startWorkflowId: number | null;
    onSelectWorkflow: (workflow: Workflow) => void;
    onMoveWorkflow: (workflowId: number, x: number, y: number) => void;
    onConnectWorkflows: (source: number, target: number) => void;
};

function WorkflowNode({ data, selected }: NodeProps<WorkflowNode>) {
    const statusClass = data.workflow.status
        ? `workflow-node-${data.workflow.status}`
        : '';

    return (
        <div
            className={`workflow-node ${
                selected ? 'workflow-node-selected' : ''
            } ${data.isStart ? 'workflow-node-start' : ''} ${statusClass}`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="workflow-handle workflow-handle-input"
                aria-label={`Connect into ${data.workflow.name}`}
            />
            <strong>{data.workflow.name}</strong>
            {data.workflow.status && <span>{data.workflow.status}</span>}
            <Handle
                type="source"
                position={Position.Right}
                className="workflow-handle workflow-handle-output"
                aria-label={`Connect from ${data.workflow.name}`}
            />
        </div>
    );
}

const nodeTypes: NodeTypes = {
    workflow: WorkflowNode,
};

export default function WorkflowCanvas({
    workflows,
    connections,
    selectedWorkflowId,
    startWorkflowId,
    onSelectWorkflow,
    onMoveWorkflow,
    onConnectWorkflows,
}: WorkflowCanvasProps) {
    const initialNodes = useMemo<WorkflowNode[]>(
        () =>
            workflows.map((workflow) => ({
                id: String(workflow.id),
                type: 'workflow',
                position: { x: workflow.x, y: workflow.y },
                data: {
                    workflow,
                    isStart: workflow.id === startWorkflowId,
                },
                selected: workflow.id === selectedWorkflowId,
            })),
        [selectedWorkflowId, startWorkflowId, workflows],
    );
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

    useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    const edges: Edge[] = connections.map((connection) => ({
        id: connection.id,
        source: String(connection.source),
        target: String(connection.target),
        type: 'smoothstep',
        style: { stroke: '#2563eb', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#facc15' },
    }));

    const handleConnect = (connection: Connection) => {
        if (!connection.source || !connection.target) {
            return;
        }

        onConnectWorkflows(Number(connection.source), Number(connection.target));
    };

    return (
        <section className="workflow-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onNodeDragStop={(_, node) =>
                    onMoveWorkflow(
                        Number(node.id),
                        node.position.x,
                        node.position.y,
                    )
                }
                onConnect={handleConnect}
                onNodeClick={(_, node) => {
                    const workflow = workflows.find(
                        (candidate) => candidate.id === Number(node.id),
                    );

                    if (workflow) {
                        onSelectWorkflow(workflow);
                    }
                }}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    style: { stroke: '#2563eb', strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#facc15',
                    },
                }}
                connectionLineStyle={{ stroke: '#2563eb', strokeWidth: 2 }}
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
