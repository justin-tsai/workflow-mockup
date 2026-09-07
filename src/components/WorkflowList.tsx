// components/WorkflowList.tsx

import WorkflowCard from './WorkflowCard';
import type { Workflow } from '../types/workflow';

type WorkflowListProps = {
    workflows: Workflow[];
    selectedWorkflowId: number | null;
    onSelectWorkflow: (workflow: Workflow) => void;
};

export default function WorkflowList({
                                         workflows,
                                         selectedWorkflowId,
                                         onSelectWorkflow,
                                     }: WorkflowListProps) {
    if (workflows.length === 0) {
        return <p>No workflows found.</p>;
    }

    return (
        <section>
            <h2>Workflows</h2>

            <div className="workflow-list">
                {workflows.map((workflow) => (
                    <WorkflowCard
                        key={workflow.id}
                        workflow={workflow}
                        isSelected={workflow.id === selectedWorkflowId}
                        onSelect={() => onSelectWorkflow(workflow)}
                    />
                ))}
            </div>
        </section>
    );
}