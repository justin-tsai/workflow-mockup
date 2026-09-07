import { useState } from 'react';
import WorkflowList from './components/WorkflowList';
import ExecutionDetails from './components/ExecutionDetails';
import { workflows } from './data/workflows';
import type { Workflow } from './types/workflow';

export default function App() {
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

    return (
        <main>
            <h1>Workflow Dashboard</h1>

            <div className="dashboard">
                <WorkflowList
                    workflows={workflows}
                    selectedWorkflowId={selectedWorkflow?.id ?? null}
                    onSelectWorkflow={setSelectedWorkflow}
                />

                {selectedWorkflow ? (
                    <ExecutionDetails workflow={selectedWorkflow} />
                ) : (
                    <p>Select a workflow to view its details.</p>
                )}
            </div>
        </main>
    );
}