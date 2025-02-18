import { getBezierPath, useInternalNode } from '@xyflow/react';
import { getEdgeParams } from '~/lib/initialElements';
import React from 'react';

interface FloatingEdgeProps {
  id: string;
  source: string;
  target: string;
  markerEnd?: string;
  style?: React.CSSProperties;
}

// Define the shape expected by getEdgeParams
interface NodeWithPosition {
  internals: {
    positionAbsolute: { x: number; y: number; };
  };
  x: number;
  y: number;
  measured: { width: number; height: number; };
}

function FloatingEdge({ id, source, target, markerEnd, style }: FloatingEdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  // Cast nodes to the expected type
  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode as unknown as NodeWithPosition,
    targetNode as unknown as NodeWithPosition,
  );

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: '#525252', // Neutral-600
        strokeWidth: 1.5,
        ...style,
      }}
    />
  );
}

export default FloatingEdge;