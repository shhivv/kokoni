import { Node } from "~/types/NodeInterface";

/**
 * Builds a hierarchical tree structure starting from a specified node
 *
 * @param parentId - The ID of the node to start building from
 * @param nodes - The flat array of all nodes
 * @returns The parent node with all its children nested within it or null if not found
 */
export function getNodeWithChildren(
  parentId: number,
  nodes: Node[],
): Node | null {
  // Find the starting node in the array
  const parentNode = nodes.find((node) => node.id === parentId);

  if (!parentNode) {
    return null;
  }

  // Create a deep copy of the parent node to avoid modifying the original
  const result: Node = { ...parentNode, children: [] };

  // Find all direct children of this parent
  const directChildren = nodes.filter((node) =>
    isChildOf(node, parentId, nodes),
  );

  // Recursively build the tree for each direct child
  result.children = directChildren.map((child) => {
    // Get this child's subtree
    const childWithChildren = getNodeWithChildren(child.id, nodes);
    return childWithChildren || { ...child, children: [] };
  });

  return result;
}

/**
 * Determines if a node is a child of a parent node
 *
 * @param node - The node to check
 * @param parentId - The ID of the parent node
 * @param allNodes - The complete array of nodes
 * @returns True if the node is a child of the parent
 */
function isChildOf(node: Node, parentId: number, allNodes: Node[]): boolean {
  // Now that we know nodes have parentId property, we can simply check it
  return node.parentId === parentId;
}
