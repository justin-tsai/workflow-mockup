import { describe, expect, it } from "vitest";
import type { WorkflowEdge, WorkflowNode } from "../types/workflow";
import {
  getExecutionOrder,
  getNextNodeId,
  wouldCreateCycle,
} from "./workflowGraph";

const nodes: WorkflowNode[] = [
  { id: 1, name: "One", status: null, description: "", x: 0, y: 0 },
  { id: 2, name: "Two", status: null, description: "", x: 100, y: 0 },
  { id: 3, name: "Three", status: null, description: "", x: 200, y: 0 },
  { id: 4, name: "Unreachable", status: null, description: "", x: 300, y: 0 },
];

const edges: WorkflowEdge[] = [
  { id: "1-2", source: 1, target: 2 },
  { id: "2-3", source: 2, target: 3 },
];

describe("workflow graph helpers", () => {
  it("rejects self and indirect cycles", () => {
    expect(wouldCreateCycle(edges, 1, 1)).toBe(true);
    expect(wouldCreateCycle(edges, 3, 1)).toBe(true);
    expect(wouldCreateCycle(edges, 1, 3)).toBe(false);
  });

  it("returns only nodes reachable from the start node", () => {
    expect(getExecutionOrder(nodes, edges, 1).map((node) => node.id)).toEqual([
      1, 2, 3,
    ]);
  });

  it("keeps execution starting with the requested node", () => {
    expect(
      getExecutionOrder(nodes, [{ id: "1-3", source: 1, target: 3 }], 1).map(
        (node) => node.id,
      ),
    ).toEqual([1, 3]);
  });

  it("generates the next node id", () => {
    expect(getNextNodeId(nodes)).toBe(5);
    expect(getNextNodeId([])).toBe(1);
  });
});
