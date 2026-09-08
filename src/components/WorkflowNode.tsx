import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import type { WorkflowNode as WorkflowNodeModel } from "../types/workflow";

export type WorkflowNodeData = {
  node: WorkflowNodeModel;
  isStart: boolean;
  isRunning: boolean;
  onSelectNode: (node: WorkflowNodeModel) => void;
  onUpdateNode: (
    nodeId: number,
    updates: Partial<Pick<WorkflowNodeModel, "name" | "description">>,
  ) => void;
};

export type WorkflowFlowNode = Node<WorkflowNodeData, "workflow">;

export default function WorkflowNode({
  data,
  selected,
}: NodeProps<WorkflowFlowNode>) {
  const [editingField, setEditingField] = useState<"name" | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState(
    data.node.description,
  );
  const [editingDescription, setEditingDescription] = useState(false);

  const beginEditing = () => {
    if (!selected || data.isRunning) return;
    setEditingField("name");
    setDraftValue(data.node.name);
  };

  const finishEditing = () => {
    if (!editingField || data.isRunning) return;
    const value = draftValue.trim();
    if (value) data.onUpdateNode(data.node.id, { name: value });
    setEditingField(null);
  };

  const statusClass = data.node.status
    ? `workflow-node-${data.node.status}`
    : "";

  return (
    <div
      className={`workflow-node ${selected ? "workflow-node-selected" : ""} ${data.isStart ? "workflow-node-start" : ""} ${data.isRunning ? "workflow-node-locked" : ""} ${statusClass}`}
      onPointerDown={() => data.onSelectNode(data.node)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="workflow-handle workflow-handle-input"
        aria-label={`Connect into ${data.node.name}`}
      />
      {editingField === "name" ? (
        <input
          className="nodrag"
          value={draftValue}
          autoFocus
          disabled={data.isRunning}
          onChange={(event) => setDraftValue(event.target.value)}
          onBlur={finishEditing}
          onKeyDown={(event) => {
            if (event.key === "Enter") finishEditing();
            if (event.key === "Escape") setEditingField(null);
          }}
        />
      ) : (
        <strong onDoubleClick={beginEditing}>{data.node.name}</strong>
      )}
      <textarea
        className={`workflow-node-description ${selected ? "nodrag" : "workflow-node-description-disabled"}`}
        value={descriptionDraft}
        readOnly={!selected || !editingDescription || data.isRunning}
        rows={2}
        onChange={(event) => setDescriptionDraft(event.target.value)}
        onDoubleClick={() => {
          if (selected && !data.isRunning) setEditingDescription(true);
        }}
        onBlur={() => {
          const value = descriptionDraft.trim();
          if (
            selected &&
            editingDescription &&
            value &&
            value !== data.node.description
          ) {
            data.onUpdateNode(data.node.id, { description: value });
          }
          setEditingDescription(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setDescriptionDraft(data.node.description);
            setEditingDescription(false);
            event.currentTarget.blur();
          }
        }}
      />
      {data.node.status && (
        <span className="workflow-node-status">{data.node.status}</span>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="workflow-handle workflow-handle-output"
        aria-label={`Connect from ${data.node.name}`}
      />
    </div>
  );
}
