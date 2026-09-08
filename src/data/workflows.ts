import type { Workflow } from "../types/workflow";

export const workflow: Workflow = {
  startNodeId: 1,
  edges: [
    { id: "1-2", source: 1, target: 2 },
    { id: "2-3", source: 2, target: 3 },
  ],
  nodes: [
    {
      id: 1,
      name: "First task",
      status: null,
      description: "Descriptions can be edited!",
      x: -225,
      y: 100,
    },
    {
      id: 2,
      name: "Titles also editable!",
      status: null,
      description: "Runs when the first task is complete.",
      x: 0,
      y: 100,
    },
    {
      id: 3,
      name: "Third Task",
      status: null,
      description: "To create more nodes, try Add Node",
      x: 225,
      y: 100,
    },
  ],
};
