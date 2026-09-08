type WorkflowToolbarProps = {
    isRunning: boolean;
    canRun: boolean;
    onRun: () => void;
    onCreate: () => void;
};

export default function WorkflowToolbar({ isRunning, canRun, onRun, onCreate }: WorkflowToolbarProps) {
    return (
        <div className="workflow-actions">
            <button type="button" onClick={onRun} disabled={isRunning || !canRun}>
                {isRunning ? 'Running...' : 'Run'}
            </button>
            <button type="button" onClick={onCreate} disabled={isRunning}>Add Node</button>
        </div>
    );
}
