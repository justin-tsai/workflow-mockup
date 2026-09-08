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
        description: 'Descriptions can be edited',
        x: 0,
        y: 100,
    },
    {
        id: 3,
        name: 'Titles can also be edited',
        status: null,
        description: 'Description of the third task',
        x: 225,
        y: 100,
    },
];
