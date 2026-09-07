// components/ExecutionDetails.tsx

import StatusBadge from './StatusBadge';
import type { Workflow } from '../types/workflow';

type ExecutionDetailsProps = {
    workflow: Workflow;
    onRetryWorkflow: (workflowId: number) => void;
    isStartNode: boolean;
    onSetStartNode: (workflowId: number) => void;
};

export default function ExecutionDetails({
                                             workflow,
                                             onRetryWorkflow,
                                             isStartNode,
                                             onSetStartNode,
                                         }: ExecutionDetailsProps) {
    return (
        <section className="execution-details">
            <div className="execution-details__header">
                <div>
                    <p>Execution details</p>
                    <h2>{workflow.name}</h2>
                </div>

                <div className="execution-details__actions">
                    <StatusBadge status={workflow.status} />
                    <button
                        type="button"
                        className="start-node-button"
                        onClick={() => onSetStartNode(workflow.id)}
                    >
                        {isStartNode ? 'Start node' : 'Set as start node'}
                    </button>
                </div>
            </div>

            <dl>
                <div>
                    <dt>Execution ID</dt>
                    <dd>{workflow.id}</dd>
                </div>

                <div>
                    <dt>Started</dt>
                    <dd>{workflow.startedAt}</dd>
                </div>

                <div>
                    <dt>Description</dt>
                    <dd>{workflow.description}</dd>
                </div>
            </dl>

            {workflow.status === 'running' && (
                <p>This workflow is currently running.</p>
            )}

            {workflow.status === 'completed' && (
                <p>This workflow completed successfully.</p>
            )}

            {workflow.status === 'failed' && (
                <div>
                    <p>This workflow failed.</p>
                    <button
                        type="button"
                        onClick={() => onRetryWorkflow(workflow.id)}
                    >
                        Retry workflow
                    </button>
                </div>
            )}
        </section>
    );
}
