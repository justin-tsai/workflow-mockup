import StatusBadge from "./StatusBadge";
import DetailsPanel from "./DetailsPanel";
import type { WorkflowNode } from "../types/workflow";

type NodeDetailsProps = {
  node: WorkflowNode;
  onRetryWorkflow: (workflowId: number) => void;
  isStartNode: boolean;
  isRunning: boolean;
  onSetStartNode: (workflowId: number) => void;
  onDeleteWorkflow: (workflowId: number) => void;
};

export default function NodeDetails({
  node,
  onRetryWorkflow,
  isStartNode,
  isRunning,
  onSetStartNode,
  onDeleteWorkflow,
}: NodeDetailsProps) {
  return (
    <DetailsPanel>
      <div className="details-panel__header">
        <div>
          <p>Node</p>
          <h2>{node.name}</h2>
        </div>
        <div className="details-panel__actions">
          <StatusBadge status={node.status} />
          {!isStartNode && !isRunning && (
            <button
              type="button"
              className="start-node-button"
              onClick={() => onSetStartNode(node.id)}
            >
              Set as start node
            </button>
          )}
          <button
            type="button"
            className="delete-node-button"
            disabled={isRunning}
            onClick={() => onDeleteWorkflow(node.id)}
          >
            Delete node
          </button>
        </div>
      </div>
      <section className="details-section">
        <h3>Node details</h3>
        <dl>
          <div>
            <dt>Node ID</dt>
            <dd>{node.id}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{node.description}</dd>
          </div>
        </dl>
      </section>
      <section className="details-section">
        <h3>Latest execution</h3>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{node.status ?? "Not run"}</dd>
          </div>
          {node.startedAt && (
            <div>
              <dt>Started</dt>
              <dd>{node.startedAt}</dd>
            </div>
          )}
        </dl>
      </section>
      {node.status === "running" && <p>This node is currently running.</p>}
      {node.status === "completed" && <p>This node completed successfully.</p>}
      {node.status === "failed" && (
        <div>
          <p>This node failed.</p>
          <button type="button" onClick={() => onRetryWorkflow(node.id)}>
            Retry node
          </button>
        </div>
      )}
    </DetailsPanel>
  );
}
