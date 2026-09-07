import type { Workflow } from '../types/workflow';

export const workflows: Workflow[] = [
    {
        id: 1,
        name: 'Analyze clinical documents',
        status: 'running',
        description: 'Extract information from uploaded documents.',
        startedAt: '2:30 PM',
        duration: 1,
    },
    {
        id: 2,
        name: 'Generate research summary',
        status: 'completed',
        description: 'Summarize the research findings.',
        startedAt: '1:15 PM',
        duration: 1,
    },
    {
        id: 3,
        name: 'Export patient report',
        status: 'failed',
        description: 'Generate and export the final report.',
        startedAt: '12:40 PM',
        duration: 1,
    },
];