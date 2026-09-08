import type { WorkflowStatus } from '../types/workflow';

type StatusBadgeProps = {
    status: WorkflowStatus | null;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    if (!status) {
        return null;
    }

    return (
        <span className={`status-badge status-badge--${status}`}>
      {status}
    </span>
    );
}
