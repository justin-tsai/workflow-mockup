import type { WorkflowStatus } from '../types/workflow';

type StatusBadgeProps = {
    status: WorkflowStatus;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span className={`status-badge status-badge--${status}`}>
      {status}
    </span>
    );
}