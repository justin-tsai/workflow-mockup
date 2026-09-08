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
    type ReactFlowInstance,
} from '@xyflow/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Workflow, WorkflowConnection } from '../types/workflow';

type WorkflowNodeData = {
    workflow: Workflow;
    isStart: boolean;
    onUpdateWorkflow: (workflowId: number, updates: Partial<Pick<Workflow, 'name' | 'description'>>) => void;
};

type WorkflowNode = Node<WorkflowNodeData, 'workflow'>;

type WorkflowCanvasProps = {
    workflows: Workflow[];
    connections: WorkflowConnection[];
    selectedWorkflowId: number | null;
    startWorkflowId: number | null;
    onSelectWorkflow: (workflow: Workflow) => void;
    onMoveWorkflow: (workflowId: number, x: number, y: number) => void;
    onUpdateWorkflow: (workflowId: number, updates: Partial<Pick<Workflow, 'name' | 'description'>>) => void;
    onConnectWorkflows: (source: number, target: number) => void;
};

function WorkflowNode({ data, selected }: NodeProps<WorkflowNode>) {
    const [editingField, setEditingField] = useState<'name' | null>(null);
    const [draftValue, setDraftValue] = useState('');
    const [descriptionDraft, setDescriptionDraft] = useState(data.workflow.description);

    const beginEditing = (field: 'name') => {
        setEditingField(field);
        setDraftValue(data.workflow[field]);
    };

    const finishEditing = () => {
        if (!editingField) return;

        const value = draftValue.trim();
        if (value) {
            data.onUpdateWorkflow(data.workflow.id, { name: value });
        }
        setEditingField(null);
    };

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
            {editingField === 'name' ? (
                <input
                    value={draftValue}
                    autoFocus
                    onChange={(event) => setDraftValue(event.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') finishEditing();
                        if (event.key === 'Escape') setEditingField(null);
                    }}
                    onClick={(event) => event.stopPropagation()}
                />
            ) : (
                <strong onDoubleClick={() => beginEditing('name')}>
                    {data.workflow.name}
                </strong>
            )}

            <textarea
                className="workflow-node-description"
                value={descriptionDraft}
                rows={2}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                onBlur={() => {
                    const value = descriptionDraft.trim();
                    if (value && value !== data.workflow.description) {
                        data.onUpdateWorkflow(data.workflow.id, { description: value });
                    }
                }}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            />

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
    onUpdateWorkflow,
    onConnectWorkflows,
}: WorkflowCanvasProps) {
    const canvasRef = useRef<HTMLElement>(null);
    const reactFlowRef = useRef<ReactFlowInstance<WorkflowNode>>(null);
    const initialNodes = useMemo<WorkflowNode[]>(
        () =>
            workflows.map((workflow) => ({
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

    useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeObserver = new ResizeObserver(() => {
            reactFlowRef.current?.fitView({ padding: 0.15, duration: 0 });
        });
        resizeObserver.observe(canvas);

        return () => resizeObserver.disconnect();
    }, []);

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
        <section ref={canvasRef} className="workflow-canvas">
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
                onInit={(instance) => {
                    reactFlowRef.current = instance;
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
