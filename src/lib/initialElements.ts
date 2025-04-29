import { type Node, type Edge, Position } from "@xyflow/react";

interface TreeNode {
  id: string;
  children?: Record<string, TreeNode>;
}

const HORIZONTAL_SPACING = 250; // Space between nodes horizontally
const VERTICAL_SPACING = 100; // Space between levels vertically

function convertToTreeNode(
  data: Record<string, unknown>,
  currentId: string,
): TreeNode {
  return {
    id: currentId,
    children: Object.entries(data).reduce(
      (acc, [key, value]) => {
        // Process all non-null values as nodes
        if (value && typeof value === "object") {
          acc[key] = convertToTreeNode(
            // If it's an object but empty or an array, treat it as empty children
            !Array.isArray(value) && Object.keys(value).length > 0
              ? (value as Record<string, unknown>)
              : {},
            key,
          );
        } else if (value) {
          // Create leaf nodes for non-object values
          acc[key] = {
            id: key,
            children: {},
          };
        }
        return acc;
      },
      {} as Record<string, TreeNode>,
    ),
  };
}

export function initialElements(data: Record<string, unknown>) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let maxNodesInLevel = 0;
  const levelNodes: Record<number, Node[]> = {};

  function processNode(node: TreeNode, level = 0, parentId?: string) {
    // Create node
    const newNode: Node = {
      id: node.id,
      data: { label: node.id },
      position: { x: 0, y: 0 }, // Temporary position
      type: "default",
    };

    // Add node to its level
    if (!levelNodes[level]) {
      levelNodes[level] = [];
    }
    levelNodes[level].push(newNode);
    maxNodesInLevel = Math.max(maxNodesInLevel, levelNodes[level].length);

    // Add edge if there's a parent
    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
      });
    }

    // Process children
    if (node.children) {
      Object.values(node.children).forEach((child) => {
        processNode(child, level + 1, node.id);
      });
    }
  }

  // Convert data to TreeNode structure and process children directly
  const rootNode = convertToTreeNode(data, "root");
  if (rootNode.children) {
    Object.values(rootNode.children).forEach((child) => {
      processNode(child, 0);
    });
  }

  // Position nodes
  Object.entries(levelNodes).forEach(([level, nodesInLevel]) => {
    const levelNum = parseInt(level);
    const totalWidth = (nodesInLevel.length - 1) * HORIZONTAL_SPACING;

    nodesInLevel.forEach((node, index) => {
      // Calculate x position to center the nodes in their level
      const startX = -(totalWidth / 2);
      node.position = {
        x: startX + index * HORIZONTAL_SPACING,
        y: levelNum * VERTICAL_SPACING,
      };
      nodes.push(node);
    });
  });

  return { nodes, edges };
}

export function getEdgeParams(source: any, target: any) {
  const sourceInternals = source.internals.positionAbsolute;
  const targetInternals = target.internals.positionAbsolute;

  const sourceCenter = {
    x: sourceInternals.x + source.measured.width / 2,
    y: sourceInternals.y + source.measured.height / 2,
  };

  const targetCenter = {
    x: targetInternals.x + target.measured.width / 2,
    y: targetInternals.y + target.measured.height / 2,
  };

  return {
    sx: sourceCenter.x,
    sy: sourceCenter.y,
    tx: targetCenter.x,
    ty: targetCenter.y,
    sourcePos: Position.Bottom,
    targetPos: Position.Top,
  };
}