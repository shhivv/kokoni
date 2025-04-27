import React from "react";
import { getBezierPath, type Position, type Node } from "@xyflow/react";
import { getEdgeParams } from "~/lib/initialElements";

interface FloatingConnectionLineProps {
  toX: number;
  toY: number;
  fromPosition: Position;
  toPosition: Position;
  fromNode: Node & {
    x: number;
    y: number;
    measured: { width: number; height: number };
    internals: { positionAbsolute: { x: number; y: number } };
  };
}

function FloatingConnectionLine({
  toX,
  toY,
  fromPosition,
  toPosition,
  fromNode,
}: FloatingConnectionLineProps) {
  if (!fromNode) {
    return null;
  }

  const targetNode = {
    id: "connection-target",
    x: toX,
    y: toY,
    measured: { width: 1, height: 1 } as const,
    internals: { positionAbsolute: { x: toX, y: toY } },
  };

  const { sx, sy } = getEdgeParams(fromNode, targetNode);
  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#525252"
        strokeWidth={1.5}
        className="animated"
        d={edgePath}
      />
      <circle
        cx={toX}
        cy={toY}
        fill="#171717"
        r={3}
        stroke="#525252"
        strokeWidth={1.5}
      />
    </g>
  );
}

export default FloatingConnectionLine;
