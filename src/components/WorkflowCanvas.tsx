import type { PointerEvent } from 'react';
import type { Workflow } from '../types/workflow';

type WorkflowCanvasProps = {
    workflows: Workflow[];
    selectedWorkflowId: number | null;
    onSelectWorkflow: (workflow: Workflow) => void;
    onMoveWorkflow: (
        workflowId: number,
        x: number,
        y: number,
    ) => void;
};

export default function WorkflowCanvas({
                                           workflows,
                                           selectedWorkflowId,
                                           onSelectWorkflow,
                                           onMoveWorkflow,
                                       }: WorkflowCanvasProps) {
    const handlePointerDown = (
        event: PointerEvent<HTMLDivElement>,
        workflow: Workflow,
    ) => {
        event.currentTarget.setPointerCapture(event.pointerId);

        const startX = event.clientX;
        const startY = event.clientY;
        const originalX = workflow.x;
        const originalY = workflow.y;

        const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
            const nextX =
                originalX + moveEvent.clientX - startX;

            const nextY =
                originalY + moveEvent.clientY - startY;

            onMoveWorkflow(workflow.id, nextX, nextY);
        };

        const handlePointerUp = () => {
            window.removeEventListener(
                'pointermove',
                handlePointerMove,
            );

            window.removeEventListener(
                'pointerup',
                handlePointerUp,
            );
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    return (
        <section className="workflow-canvas">
            {workflows.map((workflow) => (
                <div
                    key={workflow.id}
                    className={`workflow-node ${
                        workflow.id === selectedWorkflowId
                            ? 'workflow-node-selected'
                            : ''
                    }`}
                    style={{
                        left: workflow.x,
                        top: workflow.y,
                    }}
                    onPointerDown={(event) =>
                        handlePointerDown(event, workflow)
                    }
                    onClick={() => onSelectWorkflow(workflow)}
                >
                    <strong>{workflow.name}</strong>
                    <span>{workflow.status}</span>
                </div>
            ))}
        </section>
    );
}