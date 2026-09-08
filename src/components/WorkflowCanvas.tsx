import {
    BaseEdge,
    Background,
    Controls,
    Handle,
    MarkerType,
    Position,
    ReactFlow,
    getSmoothStepPath,
    useNodesState,
    type Connection,
    type Edge,
    type EdgeProps,
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
type SmartEdgeData = { routeY?: number };

// Keep these fallbacks aligned with the CSS dimensions. Measured React Flow
// dimensions take over once the nodes have been rendered.
const DEFAULT_NODE_WIDTH = 190;
const DEFAULT_NODE_HEIGHT = 112;
const EDGE_CLEARANCE = 28;
const EDGE_EXIT_OFFSET = 24;

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
};

function WorkflowNode({ data, selected }: NodeProps<WorkflowNode>) {
    const [editingField, setEditingField] = useState<'name' | null>(null);
    const [draftValue, setDraftValue] = useState('');
    const [descriptionDraft, setDescriptionDraft] = useState(data.workflow.description);
    const [editingDescription, setEditingDescription] = useState(false);

    const beginEditing = (field: 'name') => {
        if (!selected) return;

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
                    className="nodrag"
                    value={draftValue}
                    autoFocus
                    onChange={(event) => setDraftValue(event.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') finishEditing();
                        if (event.key === 'Escape') setEditingField(null);
                    }}
                />
            ) : (
                <strong onDoubleClick={() => beginEditing('name')}>
                    {data.workflow.name}
                </strong>
            )}

            <textarea
                className={`workflow-node-description ${selected ? 'nodrag' : 'workflow-node-description-disabled'}`}
                value={descriptionDraft}
                readOnly={!selected || !editingDescription}
                rows={2}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                onDoubleClick={() => {
                    if (selected) setEditingDescription(true);
                }}
                onBlur={() => {
                    const value = descriptionDraft.trim();
                    if (selected && editingDescription && value && value !== data.workflow.description) {
                        data.onUpdateWorkflow(data.workflow.id, { description: value });
                    }
                    setEditingDescription(false);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setDescriptionDraft(data.workflow.description);
                        setEditingDescription(false);
                        event.currentTarget.blur();
                    }
                }}
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

function SmartEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    style,
    data,
}: EdgeProps<Edge<SmartEdgeData>>) {
    if (!data?.routeY) {
        const [path] = getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition: Position.Right,
            targetX,
            targetY,
            targetPosition: Position.Left,
            borderRadius: 12,
            offset: 24,
        });

        return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
    }

    const isForward = targetX >= sourceX;
    const exitX = sourceX + (isForward ? EDGE_EXIT_OFFSET : -EDGE_EXIT_OFFSET);
    const entryX = targetX - (isForward ? EDGE_EXIT_OFFSET : -EDGE_EXIT_OFFSET);
    const path = [
        `M ${sourceX},${sourceY}`,
        `L ${exitX},${sourceY}`,
        `L ${exitX},${data.routeY}`,
        `L ${entryX},${data.routeY}`,
        `L ${entryX},${targetY}`,
        `L ${targetX},${targetY}`,
    ].join(' ');

    return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}

const nodeTypes: NodeTypes = {
    workflow: WorkflowNode,
};

const edgeTypes = {
    smart: SmartEdge,
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
    onDeleteConnections,
}: WorkflowCanvasProps) {
    const canvasRef = useRef<HTMLElement>(null);
    const reactFlowRef = useRef<ReactFlowInstance<WorkflowNode>>(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
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

    const getNodeSize = (workflowId: number) => {
        const node = nodes.find((candidate) => candidate.id === String(workflowId));

        return {
            width: node?.measured?.width ?? node?.width ?? DEFAULT_NODE_WIDTH,
            height: node?.measured?.height ?? node?.height ?? DEFAULT_NODE_HEIGHT,
        };
    };

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
            ? Math.max(...blockingWorkflows.map((workflow) =>
                workflow.y + getNodeSize(workflow.id).height,
            )) + EDGE_CLEARANCE
            : undefined;

        return {
            id: connection.id,
            source: String(connection.source),
            target: String(connection.target),
            type: 'smart',
            data: { routeY },
            selected,
            interactionWidth: 24,
            style: {
                stroke: selected ? '#2563eb' : '#c9cdd3',
                strokeWidth: 2,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: selected ? '#2563eb' : '#c9cdd3',
            },
        };
    });

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
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onNodeDragStop={(_, node) =>
                    onMoveWorkflow(
                        Number(node.id),
                        node.position.x,
                        node.position.y,
                    )
                }
                onConnect={handleConnect}
                onEdgeClick={(_, edge) => setSelectedConnectionId(edge.id)}
                onEdgesDelete={(deletedEdges) => {
                    setSelectedConnectionId(null);
                    onDeleteConnections(deletedEdges.map((edge) => edge.id));
                }}
                deleteKeyCode="Delete"
                onNodeClick={(_, node) => {
                    setSelectedConnectionId(null);
                    const workflow = workflows.find(
                        (candidate) => candidate.id === Number(node.id),
                    );

                    if (workflow) {
                        onSelectWorkflow(workflow);
                    }
                }}
                onPaneClick={() => setSelectedConnectionId(null)}
                onInit={(instance) => {
                    reactFlowRef.current = instance;
                }}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    style: { stroke: '#c9cdd3', strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#c9cdd3',
                    },
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
