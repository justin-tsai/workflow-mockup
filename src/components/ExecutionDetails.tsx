// components/ExecutionDetails.tsx

import StatusBadge from './StatusBadge';
import type { Workflow } from '../types/workflow';

type ExecutionDetailsProps = {
    workflow: Workflow;
};

export default function ExecutionDetails({ workflow }: ExecutionDetailsProps) {
    return (
        <section className="execution-details">
            <div className="execution-details__header">
                <div>
                    <p>Execution details</p>
                    <h2>{workflow.name}</h2>
                </div>

                <StatusBadge status={workflow.status} />
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
                    <button type="button">Retry workflow</button>
                </div>
            )}
        </section>
    );
}