import StatusBadge from './StatusBadge';
import DetailsPanel from './DetailsPanel';
import type { Workflow } from '../types/workflow';

type NodeDetailsProps = {
    workflow: Workflow;
    onRetryWorkflow: (workflowId: number) => void;
    isStartNode: boolean;
    isRunning: boolean;
    onSetStartNode: (workflowId: number) => void;
    onDeleteWorkflow: (workflowId: number) => void;
};

export default function NodeDetails({ workflow, onRetryWorkflow, isStartNode, isRunning, onSetStartNode, onDeleteWorkflow }: NodeDetailsProps) {
    return (
        <DetailsPanel>
            <div className="details-panel__header">
                <div><p>Node</p><h2>{workflow.name}</h2></div>
                <div className="details-panel__actions">
                    <StatusBadge status={workflow.status} />
                    {!isStartNode && !isRunning && <button type="button" className="start-node-button" onClick={() => onSetStartNode(workflow.id)}>Set as start node</button>}
                    <button type="button" className="delete-node-button" disabled={isRunning} onClick={() => onDeleteWorkflow(workflow.id)}>Delete node</button>
                </div>
            </div>
            <section className="details-section">
                <h3>Node details</h3>
                <dl><div><dt>Node ID</dt><dd>{workflow.id}</dd></div><div><dt>Description</dt><dd>{workflow.description}</dd></div></dl>
            </section>
            <section className="details-section">
                <h3>Latest execution</h3>
                <dl><div><dt>Status</dt><dd>{workflow.status ?? 'Not run'}</dd></div>{workflow.startedAt && <div><dt>Started</dt><dd>{workflow.startedAt}</dd></div>}</dl>
            </section>
            {workflow.status === 'running' && <p>This workflow is currently running.</p>}
            {workflow.status === 'completed' && <p>This workflow completed successfully.</p>}
            {workflow.status === 'failed' && <div><p>This workflow failed.</p><button type="button" onClick={() => onRetryWorkflow(workflow.id)}>Retry workflow</button></div>}
        </DetailsPanel>
    );
}
