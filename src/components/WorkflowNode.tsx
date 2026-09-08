import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useState } from 'react';
import type { Workflow } from '../types/workflow';

export type WorkflowNodeData = {
    workflow: Workflow;
    isStart: boolean;
    onSelectWorkflow: (workflow: Workflow) => void;
    onUpdateWorkflow: (workflowId: number, updates: Partial<Pick<Workflow, 'name' | 'description'>>) => void;
};

export type WorkflowNode = Node<WorkflowNodeData, 'workflow'>;

export default function WorkflowNode({ data, selected }: NodeProps<WorkflowNode>) {
    const [editingField, setEditingField] = useState<'name' | null>(null);
    const [draftValue, setDraftValue] = useState('');
    const [descriptionDraft, setDescriptionDraft] = useState(data.workflow.description);
    const [editingDescription, setEditingDescription] = useState(false);

    const beginEditing = () => {
        if (!selected) return;
        setEditingField('name');
        setDraftValue(data.workflow.name);
    };

    const finishEditing = () => {
        if (!editingField) return;
        const value = draftValue.trim();
        if (value) data.onUpdateWorkflow(data.workflow.id, { name: value });
        setEditingField(null);
    };

    const statusClass = data.workflow.status ? `workflow-node-${data.workflow.status}` : '';

    return (
        <div
            className={`workflow-node ${selected ? 'workflow-node-selected' : ''} ${data.isStart ? 'workflow-node-start' : ''} ${statusClass}`}
            onPointerDown={() => data.onSelectWorkflow(data.workflow)}
        >
            <Handle type="target" position={Position.Left} className="workflow-handle workflow-handle-input" aria-label={`Connect into ${data.workflow.name}`} />
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
                <strong onDoubleClick={beginEditing}>{data.workflow.name}</strong>
            )}
            <textarea
                className={`workflow-node-description ${selected ? 'nodrag' : 'workflow-node-description-disabled'}`}
                value={descriptionDraft}
                readOnly={!selected || !editingDescription}
                rows={2}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                onDoubleClick={() => { if (selected) setEditingDescription(true); }}
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
            <Handle type="source" position={Position.Right} className="workflow-handle workflow-handle-output" aria-label={`Connect from ${data.workflow.name}`} />
        </div>
    );
}
