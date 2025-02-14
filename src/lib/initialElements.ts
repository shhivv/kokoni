import { Position, MarkerType } from '@xyflow/react';
 
// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode, targetNode) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const { width: intersectionNodeWidth, height: intersectionNodeHeight } =
    intersectionNode.measured;
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;
 
  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;
 
  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetNode.measured.width / 2;
  const y1 = targetPosition.y + targetNode.measured.height / 2;
 
  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;
 
  return { x, y };
}
 
// returns the position (top,right,bottom or right) passed node compared to the intersection point
function getEdgePosition(
  node: { 
    internals: { positionAbsolute: { x: number; y: number } };
    x: number;
    y: number;
    measured: { width: number; height: number };
  }, 
  intersectionPoint: { x: number; y: number }
) {
  const n = { ...node.internals.positionAbsolute, ...node };
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);
 
  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + n.measured.width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= n.y + n.measured.height - 1) {
    return Position.Bottom;
  }
 
  return Position.Top;
}
 
// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams(
  source: {
    internals: { positionAbsolute: { x: number; y: number } };
    x: number;
    y: number;
    measured: { width: number; height: number };
  },
  target: {
    internals: { positionAbsolute: { x: number; y: number } };
    x: number; 
    y: number;
    measured: { width: number; height: number };
  }
) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);
 
  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);
 
  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

export function initialElements(
  data: Record<string, unknown>,
  options: {
    centerX?: number;
    centerY?: number;
    radius?: number;
    nodePrefix?: string;
  } = {}
) {
  const nodes = [];
  const edges = [];
  const {
    centerX = window.innerWidth / 2,
    centerY = window.innerHeight / 2,
    radius = 250,
    nodePrefix = 'node'
  } = options;

  let nodeCounter = 0;

  // Helper function to process the JSON structure
  function processJSON(obj, parentId = null) {
    // Convert object to array of entries for consistent processing
    const entries = Array.isArray(obj) 
      ? obj.map((item, index) => [String(index), item])  // Convert array items to [index, value] pairs
      : Object.entries(obj);

    entries.forEach(([key, value]) => {
      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return;
      }

      const currentId = `${nodePrefix}-${nodeCounter++}`;
      
      // Add node for current item
      nodes.push({
        id: currentId,
        data: { label: Array.isArray(obj) && String(key) },
      });

      // Add edge to parent if it exists
      if (parentId !== null) {
        edges.push({
          id: `edge-${parentId}-${currentId}`,
          source: currentId,
          target: parentId,
          type: 'floating',
          markerEnd: {
            type: MarkerType.Arrow,
          }
        });
      }

      // Recursively process children if value is an object or non-empty array
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        processJSON(value, currentId);
      }
    });
  }

  // Create root node
  const rootKey = Object.keys(data)[0];
  const rootId = 'target';
  nodes.push({
    id: rootId,
    data: { label: rootKey },
    position: { x: centerX, y: centerY }
  });

  // Process the rest of the structure
  processJSON(data[rootKey], rootId);

  // Position nodes in a circle
  const nonRootNodes = nodes.filter(node => node.id !== rootId);
  nonRootNodes.forEach((node, index) => {
    const degrees = index * (360 / nonRootNodes.length);
    const radians = degrees * (Math.PI / 180);
    const x = radius * Math.cos(radians) + centerX;
    const y = radius * Math.sin(radians) + centerY;
    node.position = { x, y };
  });

  return { nodes, edges };
}