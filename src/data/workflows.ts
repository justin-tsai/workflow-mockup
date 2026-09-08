import type { Workflow } from '../types/workflow';

export const workflows: Workflow[] = [
    {
        id: 1,
        name: 'First task',
        status: null,
        description: 'This is the first task!',
        x: -225,
        y: 100,
    },
    {
        id: 2,
        name: 'Second task',
        status: null,
        description: 'This is the second task!',
        x: 0,
        y: 100,
    },
    {
        id: 3,
        name: 'Third task',
        status: null,
        description: 'This is the third task...',
        x: 225,
        y: 100,
    },
];
