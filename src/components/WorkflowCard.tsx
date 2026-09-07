// components/WorkflowCard.tsx

import StatusBadge from './StatusBadge';
import type {Workflow} from '../types/workflow';

type WorkflowCardProps = {
    workflow: Workflow;
    isSelected: boolean;
    onSelect: () => void;
};

export default function WorkflowCard(
    {
        workflow,
        isSelected,
        onSelect,
    }: WorkflowCardProps) {
    return (
        <button
            className={`workflow-card ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <div>
                <h3>{workflow.name}</h3>
                <p>{workflow.description}</p>
            </div>

            <StatusBadge status={workflow.status}/>
        </button>
    );
}