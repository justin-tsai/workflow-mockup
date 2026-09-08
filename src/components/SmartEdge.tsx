import { BaseEdge, Position, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react';

export type SmartEdgeData = { routeY?: number };

export const DEFAULT_NODE_WIDTH = 190;
export const DEFAULT_NODE_HEIGHT = 112;
export const EDGE_CLEARANCE = 28;
export const EDGE_EXIT_OFFSET = 24;

export default function SmartEdge({ sourceX, sourceY, targetX, targetY, markerEnd, style, data }: EdgeProps<Edge<SmartEdgeData>>) {
    if (!data?.routeY) {
        const [path] = getSmoothStepPath({
            sourceX, sourceY, sourcePosition: Position.Right,
            targetX, targetY, targetPosition: Position.Left,
            borderRadius: 12, offset: EDGE_EXIT_OFFSET,
        });
        return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
    }

    const isForward = targetX >= sourceX;
    const exitX = sourceX + (isForward ? EDGE_EXIT_OFFSET : -EDGE_EXIT_OFFSET);
    const entryX = targetX - (isForward ? EDGE_EXIT_OFFSET : -EDGE_EXIT_OFFSET);
    const path = [
        `M ${sourceX},${sourceY}`,
        `L ${exitX},${sourceY}`,
        `L ${exitX},${data.routeY}`,
        `L ${entryX},${data.routeY}`,
        `L ${entryX},${targetY}`,
        `L ${targetX},${targetY}`,
    ].join(' ');

    return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}
