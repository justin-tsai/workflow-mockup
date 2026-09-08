import DetailsPanel from './DetailsPanel';
import type { WorkflowNode } from '../types/workflow';

type ConnectionDetailsProps = {
    source: WorkflowNode;
    target: WorkflowNode;
    onDeleteConnection: () => void;
};

export default function ConnectionDetails({
    source,
    target,
    onDeleteConnection,
}: ConnectionDetailsProps) {
    return (
        <DetailsPanel>
            <div className="details-panel__header">
                <div>
                    <p>Connection</p>
                    <h2>{source.name} -&gt; {target.name}</h2>
                </div>
            </div>

            <dl>
                <div>
                    <dt>From</dt>
                    <dd>{source.name}</dd>
                </div>
                <div>
                    <dt>To</dt>
                    <dd>{target.name}</dd>
                </div>
            </dl>

            <button type="button" className="delete-node-button" onClick={onDeleteConnection}>
                Delete connection
            </button>
        </DetailsPanel>
    );
}
